import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

assert.equal(packageJson.name, "@telecrypt-io/ui");
assert.equal(packageJson.version, "0.1.2");
assert.equal(packageJson.private, true);
assert.deepEqual(Object.keys(packageJson.exports).sort(), ["./logo-mark.png", "./product.css"]);
assert.deepEqual(packageJson.files, ["src", "assets", "README.md", "LICENSE"]);
assert.deepEqual(packageJson.dependencies ?? {}, {});
assert.deepEqual(packageJson.devDependencies ?? {}, {});

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
assert.match(readme, /^# @telecrypt-io\/ui$/m);
assert.doesNotMatch(readme, /0\.1\.1/);
assert.match(readme, /repository administrator must enforce/);
assert.match(readme, /protected, non-force-movable release tags/);
assert.match(readme, /not an atomic\s+tag-and-release transaction/);

const workflow = fs.readFileSync(path.join(root, ".github/workflows/verify.yml"), "utf8");
const transportPath = path.join(root, ".github/scripts/git_transport.sh");
const transport = fs.readFileSync(transportPath, "utf8");
assert.match(workflow, /\.assets\[0\]\.digest/);
assert.match(workflow, /\.assets\[0\]\.size/);
assert.match(workflow, /\.assets\[0\]\.id/);
assert.match(workflow, /\.assets\[0\]\.state == "uploaded"/);
assert.match(workflow, /browser_download_url/);
assert.match(workflow, /MAX_API_JSON_BYTES: 262144/);
assert.match(workflow, /MAX_ASSET_BYTES: 1048576/);
assert.match(workflow, /MAX_COMMAND_OUTPUT_BYTES: 65536/);
assert.ok((workflow.match(/X-GitHub-Api-Version: 2026-03-10/g) ?? []).length >= 3);
assert.match(workflow, /--repo "github\.com\/\$GITHUB_REPOSITORY"/);
assert.match(workflow, /--draft\s+\\/);
assert.match(workflow, /gh release edit/);
assert.match(workflow, /--draft=false/);
assert.match(workflow, /--tag "\$RELEASE"/);
assert.match(workflow, /--hostname github\.com/);
assert.match(workflow, /actions\/checkout@v7\.0\.1/);
assert.match(workflow, /actions\/setup-node@v7\.0\.0/);
assert.match(workflow, /node-version: "22\.23\.2"/);
assert.match(workflow, /gh release edit --help/);
assert.match(workflow, /grep -F -- '--verify-tag' "\$edit_help"/);
assert.match(workflow, /local-read "\$kind" "\$ref"/);
assert.match(workflow, /cat-file-type "\$GITHUB_REF"/);
assert.match(workflow, /rev-parse "\$remote_tag_ref"/);
assert.match(workflow, /local-ancestor "\$release_commit" refs\/remotes\/origin\/main/);
assert.doesNotMatch(workflow, /git (cat-file|rev-parse|merge-base)/);
assert.match(workflow, /\.immutable == \$expected_immutable/);
assert.match(workflow, /\.published_at/);
assert.match(workflow, /\.body == \$body/);
assert.match(workflow, /\.assets_url/);
assert.match(workflow, /\.upload_url/);
assert.doesNotMatch(workflow, /mentions_count/);
assert.match(workflow, /releases\/tag\/" \+ \$tag/);
assert.match(workflow, /releases\/" \+ \$tag/);
assert.match(workflow, /\.created_at \| valid_time/);
assert.doesNotMatch(workflow, /target_commitish/);
assert.match(workflow, /\.tarball_url/);
assert.match(workflow, /\.zipball_url/);
assert.match(workflow, /\.assets\[0\]\.created_at \| valid_time/);
assert.match(workflow, /\.assets\[0\]\.updated_at \| valid_time/);
assert.match(workflow, /\.assets\[0\]\.created_at \| epoch/);
assert.match(workflow, /\.assets\[0\]\.updated_at \| epoch/);
assert.match(workflow, /\.published_at \| epoch/);
assert.match(workflow, /verify_release_metadata "\$release_json" true false false/);
assert.match(workflow, /verify_release_metadata "\$final_release_json" false true true/);
assert.match(workflow, /bounded_command_to_file/);
assert.match(workflow, /bounded_command_to_files_with_timeout/);
assert.match(workflow, /gh release create emitted unexpected stdout/);
assert.match(workflow, /gh release create emitted unexpected stderr/);
assert.match(workflow, /expected_release_url="https:\/\/github\.com\/\$GITHUB_REPOSITORY\/releases\/tag\/\$RELEASE"/);
assert.match(workflow, /test "\$\(wc -l <"\$release_publish_output"\)" -eq 1/);
assert.match(workflow, /gh release edit emitted unexpected stderr/);
assert.match(workflow, /test "\$\(cat -- "\$release_publish_output"\)" = "\$expected_release_url"/);
assert.match(workflow, /ulimit -f/);
assert.match(workflow, /pack_file_limit_blocks/);
assert.match(workflow, /MAX_ASSET_BYTES % 512/);
assert.match(workflow, /test "\$package_size" -le "\$MAX_ASSET_BYTES"/);
assert.match(workflow, /gh_bounded_to_file "\$package_size"/);
assert.match(workflow, /probe_existing_release/);
assert.match(workflow, /probe_release_list/);
assert.match(workflow, /releases\?per_page=100&page=\$page/);
assert.match(workflow, /release list reached its bounded page cap/);
assert.match(workflow, /probe_release_list "\$release_json" \|\| list_status=\$\?/);
assert.match(workflow, /api --include/);
assert.match(workflow, /404\)/);
assert.match(workflow, /expected_404_error="gh: HTTP 404: Not Found/);
assert.match(workflow, /\.message == "Not Found"/);
assert.match(workflow, /documentation_url/);
assert.match(workflow, /exact immutable release already exists/);
assert.match(workflow, /group: shared-ui-release-\$\{\{ github\.ref_name \}\}/);
assert.match(workflow, /cancel-in-progress: false/);
assert.match(workflow, /GIT_CONFIG_NOSYSTEM: "1"/);
assert.match(workflow, /GIT_CONFIG_GLOBAL: \/dev\/null/);
assert.match(workflow, /GIT_CONFIG_PARAMETERS: ""/);
assert.match(workflow, /git_fetch_error="\$RUNNER_TEMP\/git-fetch-error"/);
assert.match(workflow, /git fetch emitted unexpected output/);
assert.match(workflow, /bounded_fetch/);
assert.match(workflow, /bash \.github\/scripts\/git_transport\.sh fetch "\$GITHUB_REPOSITORY"/);
assert.doesNotMatch(workflow, /git fetch --/);
assert.doesNotMatch(workflow, /git ls-remote/);
assert.doesNotMatch(workflow, /TELECRYPT_UI_RELEASE_PREREQUISITES/);
assert.ok(workflow.indexOf("probe_existing_release") < workflow.indexOf("gh release create \\\n"));
assert.doesNotMatch(workflow, /gh --hostname[^\n]*release/);
assert.doesNotMatch(workflow, /gh api[^\n]*--repo/);
assert.doesNotMatch(workflow, /bounded_help "\$git_fetch_output"/);
assert.doesNotMatch(workflow, /--target(?:=|\s)/);
assert.doesNotMatch(workflow, /checksum_name/);

for (const required of [
  "/usr/bin/git",
  "https://github.com/TeleCrypt-io/ui-shared-css.git",
  "GIT_CONFIG_SYSTEM=/dev/null",
  "GIT_CONFIG_GLOBAL=/dev/null",
  "GIT_CONFIG_COUNT=0",
  "GIT_CONFIG_PARAMETERS=",
  "GIT_ASKPASS=",
  "GIT_SSH_COMMAND=",
  "HTTP_PROXY=",
  "HTTPS_PROXY=",
  "GIT_SSL_NO_VERIFY=",
  "GIT_SSL_CAINFO=",
  "GIT_DIR",
  "GIT_COMMON_DIR",
  "GIT_OBJECT_DIRECTORY",
  "GIT_ALTERNATE_OBJECT_DIRECTORIES",
  "GIT_INDEX_FILE",
  "GIT_NAMESPACE",
  "GIT_REPLACE_REF_BASE",
  "GIT_EXEC_PATH",
  "core.askpass",
  "protocol.version=2",
  "protocol.https.allow=always",
  "credential.helper=",
  "credential.useHttpPath=false",
  "core.sshCommand=",
  "core.gitproxy=",
  "core.hooksPath=/dev/null",
  "--no-includes",
  "protocol(\\..*)?",
  "remote\\..*\\.(uploadpack|proxy)",
]) {
  assert.ok(transport.includes(required), required);
}

const hostileRepo = fs.mkdtempSync(path.join(os.tmpdir(), "ui-git-transport-"));
try {
  const init = spawnSync("git", ["init", "--quiet", hostileRepo], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  const config = (key, value, scope = "--local") => {
    const result = spawnSync("git", ["-C", hostileRepo, "config", scope, key, value], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  const check = (env = {}) => spawnSync("bash", [transportPath, "check"], {
    cwd: hostileRepo,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  assert.equal(check({
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "http.proxy",
    GIT_CONFIG_VALUE_0: "http://evil.example:8080",
    GIT_CONFIG_PARAMETERS: "'http.proxy=http://evil.example:8080'",
    GIT_ASKPASS: "/tmp/evil-askpass",
    GIT_SSH_COMMAND: "ssh -oProxyCommand=evil",
    HTTPS_PROXY: "http://evil.example:8080",
    GIT_SSL_NO_VERIFY: "1",
  }).status, 0, "hostile process environment was not blanked");
  for (const [key, value] of [
    ["url.https://evil.example/.insteadOf", "https://github.com/"],
    ["http.proxy", "http://evil.example:8080"],
    ["http.sslVerify", "false"],
    ["protocol.file.allow", "always"],
    ["credential.helper", "!touch /tmp/credential-helper"],
    ["include.path", "/tmp/evil-git-config"],
    ["core.askPass", "/tmp/evil-askpass"],
    ["core.sshCommand", "ssh -oProxyCommand=evil"],
    ["core.gitProxy", "evil-proxy"],
    ["remote.origin.pushurl", "https://evil.example/push.git"],
    ["remote.origin.vcs", "ssh"],
    ["remote.origin.uploadpack", "evil-upload-pack"],
    ["remote.origin.proxy", "http://evil.example:8080"],
  ]) {
    config(key, value);
    assert.notEqual(check().status, 0, key);
    spawnSync("git", ["-C", hostileRepo, "config", "--local", "--unset-all", key]);
  }
  config("extensions.worktreeConfig", "true");
  config("remote.origin.proxy", "http://evil.example:8080", "--worktree");
  assert.notEqual(check().status, 0, "worktree override");
} finally {
  fs.rmSync(hostileRepo, { recursive: true, force: true });
}

const boundaryRepo = fs.mkdtempSync(path.join(os.tmpdir(), "ui-git-boundary-"));
try {
  const init = spawnSync("git", ["init", "--quiet", boundaryRepo], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  const boundaryEnv = {
    ...process.env,
    GIT_DIR: path.join(boundaryRepo, ".git"),
    GIT_COMMON_DIR: path.join(boundaryRepo, ".git"),
    GIT_OBJECT_DIRECTORY: path.join(boundaryRepo, "objects-hostile"),
    GIT_ALTERNATE_OBJECT_DIRECTORIES: path.join(boundaryRepo, "alternates-hostile"),
    GIT_INDEX_FILE: path.join(boundaryRepo, "index-hostile"),
    GIT_NAMESPACE: "hostile",
    GIT_REPLACE_REF_BASE: "refs/replace/hostile/",
    GIT_EXEC_PATH: path.join(boundaryRepo, "git-core-hostile"),
  };
  let result = spawnSync("bash", [transportPath, "check"], {
    cwd: boundaryRepo,
    env: boundaryEnv,
    encoding: "utf8",
    timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);

  result = spawnSync("bash", [transportPath, "fetch", "TeleCrypt-io/ui-shared-css", "--upload-pack=/tmp/secret-capture"], {
    cwd: boundaryRepo,
    encoding: "utf8",
    timeout: 5000,
  });
  assert.notEqual(result.status, 0);

  const configPath = path.join(boundaryRepo, ".git", "config");
  let hugeConfig = "";
  for (let index = 0; index < 5000; index += 1) hugeConfig += `[hostile-${index}]\n\tvalue = ${index}\n`;
  fs.appendFileSync(configPath, hugeConfig);
  result = spawnSync("bash", [transportPath, "check"], {
    cwd: boundaryRepo,
    encoding: "utf8",
    timeout: 5000,
  });
  assert.notEqual(result.status, 0);

  fs.unlinkSync(configPath);
  fs.mkfifoSync?.(configPath);
  if (typeof fs.mkfifoSync !== "function") {
    // Node does not expose mkfifo on all supported runners; use the system
    // utility only for this bounded hostile-input check when available.
    const fifo = spawnSync("mkfifo", [configPath], { encoding: "utf8" });
    assert.equal(fifo.status, 0, fifo.stderr);
  }
  result = spawnSync("bash", [transportPath, "check"], {
    cwd: boundaryRepo,
    encoding: "utf8",
    timeout: 5000,
  });
  assert.notEqual(result.status, 0);
} finally {
  fs.rmSync(boundaryRepo, { recursive: true, force: true });
}

const executableRepo = fs.mkdtempSync(path.join(os.tmpdir(), "ui-git-executable-"));
try {
  const init = spawnSync("git", ["init", "--quiet", executableRepo], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  const hostileBin = path.join(executableRepo, "hostile-bin");
  fs.mkdirSync(hostileBin);
  const marker = path.join(executableRepo, "executed");
  const fake = `#!/bin/sh\nprintf secret > ${marker}\nexit 99\n`;
  fs.writeFileSync(path.join(hostileBin, "git"), fake, { mode: 0o700 });
  fs.writeFileSync(path.join(hostileBin, "git-remote-https"), fake, { mode: 0o700 });
  const result = spawnSync("/bin/bash", [transportPath, "check"], {
    cwd: executableRepo,
    env: { ...process.env, PATH: hostileBin, GIT_EXEC_PATH: hostileBin, HTTPS_PROXY: "https://secret.invalid" },
    encoding: "utf8",
    timeout: 5000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(marker), false);
} finally {
  fs.rmSync(executableRepo, { recursive: true, force: true });
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
