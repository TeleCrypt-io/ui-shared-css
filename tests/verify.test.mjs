import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const transport = path.join(root, ".github/scripts/git_transport.sh");
const transportSource = fs.readFileSync(transport, "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

assert.equal(packageJson.name, "@telecrypt-io/ui");
assert.equal(packageJson.version, "0.1.7");
assert.equal(packageJson.private, true);
assert.deepEqual(Object.keys(packageJson.exports).sort(), ["./logo-mark.png", "./product.css"]);
assert.deepEqual(packageJson.dependencies ?? {}, {});
assert.deepEqual(packageJson.devDependencies ?? {}, {});
assert.match(transportSource, /-c http\.sslVerify=true/);
assert.doesNotMatch(transportSource, /-c http\.sslCA(?:Info|Path)=/);
assert.doesNotMatch(transportSource, /-c http\.ssl(?:Cert|Key)=/);

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.match(readme, /^# @telecrypt-io\/ui$/m);
assert.doesNotMatch(readme, /0\.1\.1/);

function runGit(rootPath, ...args) {
  const result = spawnSync("/usr/bin/git", ["-C", rootPath, ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

const repo = fs.mkdtempSync(path.join(os.tmpdir(), "ui-git-semantic-"));
try {
  runGit(repo, "init", "--quiet");
  runGit(repo, "-c", "user.email=test@example.invalid", "-c", "user.name=Test", "commit", "--allow-empty", "--quiet", "-m", "first");
  const head = runGit(repo, "rev-parse", "HEAD");
  runGit(repo, "-c", "user.email=test@example.invalid", "-c", "user.name=Test", "tag", "-a", "v0.1.7", "-m", "release");
  const annotatedTagObject = runGit(repo, "rev-parse", "refs/tags/v0.1.7");
  const annotatedTagCommit = runGit(repo, "rev-parse", "refs/tags/v0.1.7^{}");
  assert.notEqual(annotatedTagObject, annotatedTagCommit);
  assert.equal(annotatedTagCommit, head);
  const local = spawnSync("bash", [transport, "local-read", "rev-parse", "HEAD"], {
    cwd: repo,
    env: {
      ...process.env,
      GIT_DIR: path.join(repo, "missing"),
      GIT_INDEX_FILE: path.join(repo, "missing-index"),
      GIT_CONFIG_COUNT: "1",
      GIT_CONFIG_KEY_0: "http.proxy",
      GIT_CONFIG_VALUE_0: "http://evil.invalid",
      GIT_TRACE: "/tmp/ui-hostile-trace",
      GIT_TRACE2: "/tmp/ui-hostile-trace2",
      GIT_TRACE_PACK_ACCESS: "1",
      GIT_TRACE_PERFORMANCE: "1",
      GIT_TRACE_PACKET: "1",
      GIT_TRACE_SHALLOW: "1",
      GIT_CURL_VERBOSE: "1",
      GIT_TRACE2_ENV_VARS: "GIT_DIR",
      GIT_TRACE2_MAX_FILES: "1",
      HTTPS_PROXY: "http://evil.invalid",
      GIT_ALLOW_PROTOCOL: "file:ext:ssh",
      GIT_PROTOCOL_FROM_USER: "1",
    },
    encoding: "utf8",
  });
  assert.equal(local.status, 0, local.stderr);
  assert.equal(local.stdout.trim(), head);

  runGit(repo, "remote", "add", "origin", "https://github.com/TeleCrypt-io/ui-shared-css");
  const checkoutOrigin = spawnSync("bash", [transport, "local-read", "rev-parse", "HEAD"], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(checkoutOrigin.status, 0, checkoutOrigin.stderr);
  assert.equal(checkoutOrigin.stdout.trim(), head);

  const malformed = spawnSync("bash", [transport, "local-read", "rev-parse", "--option"], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.notEqual(malformed.status, 0);
  const wrongRepository = spawnSync(
    "bash",
    [transport, "fetch", "Other/repository", "refs/heads/main:refs/remotes/origin/main"],
    { cwd: repo, encoding: "utf8" },
  );
  assert.notEqual(wrongRepository.status, 0);

  for (const [key, value] of [
    ["url.hostile.insteadOf", "https://github.com/"],
    ["url.hostile.pushInsteadOf", "https://github.com/"],
    ["include.path", path.join(repo, "included-config")],
    ["includeIf.onbranch:main.path", path.join(repo, "included-config")],
    ["credential.helper", "store"],
    ["hooks.allownonstdhook", "true"],
    ["core.hooksPath", path.join(repo, "hooks")],
    ["remote.origin.vcs", "hostile-helper"],
    ["remote.origin.proxy", "http://evil.invalid"],
    ["remote.origin.uploadpack", "/tmp/hostile-upload-pack"],
    ["remote.origin.receivepack", "/tmp/hostile-receive-pack"],
    ["remote.origin.pushurl", "https://evil.invalid/repository.git"],
    ["remote.evil.vcs", "hostile-helper"],
    ["remote.evil.pushurl", "https://evil.invalid/repository.git"],
    ["remote.evil.url", "https://evil.invalid/repository.git"],
  ]) {
    runGit(repo, "config", "--local", key, value);
    const rejected = spawnSync("bash", [transport, "local-read", "rev-parse", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
    });
    assert.notEqual(rejected.status, 0, key);
    spawnSync("/usr/bin/git", ["-C", repo, "config", "--local", "--unset-all", key], { encoding: "utf8" });
  }
} finally {
  fs.rmSync(repo, { recursive: true, force: true });
}

const workflow = fs.readFileSync(path.join(root, ".github/workflows/verify.yml"), "utf8");
assert.match(workflow, /rev-parse refs\/remotes\/origin\/release-tag\^\{commit\}/);
assert.match(workflow, /tag_object=.*rev-parse/);
assert.doesNotMatch(workflow, /rev-parse refs\/remotes\/origin\/release-tag\^\{\}\).*rev-parse/);
assert.match(workflow, /annotated tag \$tag_object/);
assert.match(workflow, /--verify-tag --target "\$RELEASE_SHA"/);
assert.match(workflow, /npm pack/);
assert.match(workflow, /id: package/);
assert.match(workflow, /actions\/upload-artifact@v7\.0\.1/);
assert.match(workflow, /shared-ui-\$\{\{ github\.run_id \}\}-\$\{\{ github\.sha \}\}/);
assert.match(workflow, /GITHUB_RUN_ATTEMPT/);
assert.match(workflow, /check_published/);
assert.match(workflow, /package_size.*64 \* 1024 \* 1024/);
assert.match(workflow, /bounded_command/);
assert.doesNotMatch(workflow, /ulimit\s+-f/);
assert.doesNotMatch(workflow, /grep -Eiq '\(\^\|\[\^0-9\]\)404/);
assert.match(
  fs.readFileSync(path.join(root, ".github/scripts/bounded-command.sh"), "utf8"),
  /bounded-command\.py/,
);
assert.match(
  fs.readFileSync(path.join(root, ".github/scripts/bounded-command.py"), "utf8"),
  /start_new_session=True/,
);

const boundedCommand = path.join(root, ".github/scripts/bounded-command.sh");
const boundedDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ui-bounded-command-"));
try {
  const boundedStdout = path.join(boundedDirectory, "stdout");
  const boundedStderr = path.join(boundedDirectory, "stderr");
  const boundedResult = spawnSync(
    "bash",
    [
      boundedCommand,
      "65536",
      "65536",
      boundedStdout,
      boundedStderr,
      "10",
      "python3",
      "-c",
      "from pathlib import Path; Path('work.bin').write_bytes(b'x' * 131072); print('ok')",
    ],
    { cwd: boundedDirectory, encoding: "utf8" },
  );
  assert.equal(boundedResult.status, 0, boundedResult.stderr);
  assert.equal(fs.readFileSync(boundedStdout, "utf8"), "ok\n");
  assert.equal(fs.readFileSync(boundedStderr, "utf8"), "");
  assert.equal(fs.statSync(path.join(boundedDirectory, "work.bin")).size, 131072);
} finally {
  fs.rmSync(boundedDirectory, { recursive: true, force: true });
}

const descendantDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ui-descendant-command-"));
try {
  const descendantResult = spawnSync(
    "bash",
    [
      boundedCommand,
      "1024",
      "1024",
      path.join(descendantDirectory, "stdout"),
      path.join(descendantDirectory, "stderr"),
      "10",
      "python3",
      "-c",
      "import subprocess,sys; subprocess.Popen([sys.executable,'-c','import time; time.sleep(60)']); print('leader')",
    ],
    { cwd: descendantDirectory, encoding: "utf8", timeout: 10000 },
  );
  assert.equal(descendantResult.status, 0, descendantResult.stderr);
  assert.equal(fs.readFileSync(path.join(descendantDirectory, "stdout"), "utf8"), "leader\n");
} finally {
  fs.rmSync(descendantDirectory, { recursive: true, force: true });
}

for (const relativePath of ["src/product.css", "assets/logo-mark.png"]) {
  const absolutePath = path.join(root, relativePath);
  assert.ok(fs.statSync(absolutePath).isFile(), relativePath);
  assert.ok(fs.statSync(absolutePath).size > 0, relativePath);
}

const checksums = fs.readFileSync(path.join(root, "CHECKSUMS.sha256"), "utf8").trim().split("\n");
assert.equal(checksums.length, 2);
for (const line of checksums) {
  const match = /^(?<digest>[0-9a-f]{64})  (?<file>.+)$/.exec(line);
  assert.ok(match, line);
  const digest = crypto.createHash("sha256").update(fs.readFileSync(path.join(root, match.groups.file))).digest("hex");
  assert.equal(digest, match.groups.digest, match.groups.file);
}
