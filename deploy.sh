#!/bin/bash
# -----------------------------------------------
# ALIEN INVASION UPDATE SCRIPT
# Run this file whenever you make changes! 
# -----------------------------------------------

echo "🚀 Saving your changes to GitHub..."
git add .
git commit -m "Update game files"
git push origin main

echo "-----------------------------------------------"
echo "🔥 Pushing new update to Firebase Hosting..."
npx firebase-tools@13.15.0 deploy --only hosting

echo "-----------------------------------------------"
echo "✅ Finished! Your Github and Firebase are both up to date."
echo "Public URL: https://alieninvasion-95c7d.web.app"
