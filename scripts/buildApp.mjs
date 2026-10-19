import { copyFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputApk = join(projectRoot, 'MarketMix-RealEstates-debug.apk');
const publicApk = join(projectRoot, 'public', 'MarketMix-RealEstates-debug.apk');
const androidDirectory = join(projectRoot, 'android');
const gradleOutput = join(androidDirectory, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const googleServicesConfig = join(androidDirectory, 'app', 'google-services.json');

function run(command, args, cwd = projectRoot) {
  const windows = process.platform === 'win32';
  const result = windows
    ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], { cwd, stdio: 'inherit' })
    : spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
}

try {
  await rm(outputApk, { force: true });
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
  run(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android']);

  const gradleCommand = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
  if (process.platform === 'win32') {
    const sdkPath = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
    if (existsSync(sdkPath)) {
      process.env.ANDROID_HOME = sdkPath;
      process.env.ANDROID_SDK_ROOT = sdkPath;
    }
    const bundledJdk = join(process.env.ProgramFiles || 'C:\\Program Files', 'Android', 'Android Studio', 'jbr');
    if (existsSync(join(bundledJdk, 'bin', 'java.exe'))) process.env.JAVA_HOME = bundledJdk;
  }
  run(gradleCommand, ['clean', ':app:assembleDebug'], androidDirectory);

  await mkdir(projectRoot, { recursive: true });
  await copyFile(gradleOutput, outputApk);
  await mkdir(dirname(publicApk), { recursive: true });
  await copyFile(gradleOutput, publicApk);
  console.log(`APK ready: ${outputApk}`);
  if (!existsSync(googleServicesConfig)) {
    console.warn('Google sign-in needs android/app/google-services.json from the Firebase Android app setup. Email/password sign-in remains available.');
  }
} catch (error) {
  console.error(`Android build failed: ${error.message}`);
  process.exitCode = 1;
}
