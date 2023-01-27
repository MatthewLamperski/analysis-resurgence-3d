KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12

# Recreate certificate from secure env var
echo $MAC_CERTS | base64 --decode > $CERTIFICATE_P12

# create keychain
security create-keychain -p actions $KEY_CHAIN

security default-keychain -s $KEY_CHAIN

security unlock-keychain -p actions $KEY_CHAIN

security import $CERTIFICATE_P12 -k $KEY_CHAIN $MAC_CERTS_PASSWORD -T /usr/bin/codesign

security set-key-partition-list -S apple-tool:,apple: -s -k actions $KEY_CHAIN

rm -fr *.p12
