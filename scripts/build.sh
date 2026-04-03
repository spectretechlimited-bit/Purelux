#!/bin/bash

# Build script for Netlify
# Generates firebase-env.js from environment variables

echo "📦 Generating firebase-env.js from environment variables..."

# Create the firebase-env.js file from env variables
cat > assets/js/firebase-env.js << 'EOF'
window.__ENV = {
    VITE_FIREBASE_API_KEY: "$VITE_FIREBASE_API_KEY",
    VITE_FIREBASE_AUTH_DOMAIN: "$VITE_FIREBASE_AUTH_DOMAIN",
    VITE_FIREBASE_PROJECT_ID: "$VITE_FIREBASE_PROJECT_ID",
    VITE_FIREBASE_STORAGE_BUCKET: "$VITE_FIREBASE_STORAGE_BUCKET",
    VITE_FIREBASE_MESSAGING_SENDER_ID: "$VITE_FIREBASE_MESSAGING_SENDER_ID",
    VITE_FIREBASE_APP_ID: "$VITE_FIREBASE_APP_ID",
    VITE_FIREBASE_MEASUREMENT_ID: "$VITE_FIREBASE_MEASUREMENT_ID",
};
EOF

# Now substitute the actual values
if [ -n "$VITE_FIREBASE_API_KEY" ]; then
    sed -i "s|\$VITE_FIREBASE_API_KEY|$VITE_FIREBASE_API_KEY|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_AUTH_DOMAIN" ]; then
    sed -i "s|\$VITE_FIREBASE_AUTH_DOMAIN|$VITE_FIREBASE_AUTH_DOMAIN|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_PROJECT_ID" ]; then
    sed -i "s|\$VITE_FIREBASE_PROJECT_ID|$VITE_FIREBASE_PROJECT_ID|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_STORAGE_BUCKET" ]; then
    sed -i "s|\$VITE_FIREBASE_STORAGE_BUCKET|$VITE_FIREBASE_STORAGE_BUCKET|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then
    sed -i "s|\$VITE_FIREBASE_MESSAGING_SENDER_ID|$VITE_FIREBASE_MESSAGING_SENDER_ID|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_APP_ID" ]; then
    sed -i "s|\$VITE_FIREBASE_APP_ID|$VITE_FIREBASE_APP_ID|g" assets/js/firebase-env.js
fi
if [ -n "$VITE_FIREBASE_MEASUREMENT_ID" ]; then
    sed -i "s|\$VITE_FIREBASE_MEASUREMENT_ID|$VITE_FIREBASE_MEASUREMENT_ID|g" assets/js/firebase-env.js
fi

echo "✅ firebase-env.js generated successfully"
