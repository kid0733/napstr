



Here's the rundown of how we created the IPA without a developer account:

1. **Built the Archive in Xcode**
   - Opened the project in Xcode
   - Set "User Script Sandboxing" to "No" in Build Settings to fix permission errors
   - Selected "Any iOS Device (arm64)" as target
   - Built the app which created `napstr.xcarchive`

2. **Converted Archive to IPA manually**
   - Renamed the archive from `napstr 28-12-2024, 6.38 am.xcarchive` to `napstr.xcarchive` for easier handling
   - Created a `Payload` directory
   - Copied the `.app` from inside the archive's Products/Applications folder to `Payload/`
   - Zipped the `Payload` folder to create `app.ipa`
   - Cleaned up by removing the `Payload` directory

The key commands were:

```
cd ios && xcodebuild -workspace napstr.xcworkspace -scheme napstr -configuration Release -archivePath napstr.xcarchive archive CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO ENABLE_USER_SCRIPT_SANDBOXING=NO ARCHS="arm64" ONLY_ACTIVE_ARCH=NO

```




```bash
mkdir -p Payload
cp -r napstr.xcarchive/Products/Applications/napstr.app Payload/
zip -r app.ipa Payload
rm -rf Payload
```

This method works without a developer account because we're:
1. Building locally first
2. Manually packaging the app
3. Bypassing Apple's normal signing process

The resulting IPA can be installed using tools like AltStore or similar sideloading methods.
