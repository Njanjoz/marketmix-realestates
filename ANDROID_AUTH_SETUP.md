# Android Google sign-in setup

Capacitor native Google sign-in is wired to the Firebase JavaScript Auth session. The Android app still needs its Firebase Android OAuth configuration before Google sign-in can complete.

1. In Firebase project `housing-database-e467b`, register an Android app with package name `com.marketmix.realestates`.
2. From the `android` folder, run `.\gradlew.bat :app:signingReport` and copy the debug SHA-1 into that Firebase Android app. Add the release and Play App Signing SHA-1 fingerprints before distributing a release build.
3. Enable Google under Firebase Authentication sign-in providers.
4. Download the generated `google-services.json` and place it at `android/app/google-services.json`.
5. Run `npm run build-app` again.

The build script warns when the Android Firebase file is missing. Do not replace the web Firebase configuration; the website continues using Firebase's browser Google sign-in.
