KEY_CHAIN=build.keychain
CERTIFICATE_P12=certificate.p12

# Recreate certificate from secure env var
echo $MAC_CERTS | base64 --decode > $CERTIFICATE_P12

# create keychain
security create-keychain -p actions $KEY_CHAIN

echo 1

security default-keychain -s $KEY_CHAIN
echo 2

security unlock-keychain -p actions $KEY_CHAIN
echo 3

security import $CERTIFICATE_P12 -k $KEY_CHAIN -P $MAC_CERTS_PASSWORD -T /usr/bin/codesign
echo 4
security set-key-partition-list -S apple-tool:,apple: -s -k actions $KEY_CHAIN
echo 5
rm -fr *.p12
echo 6
