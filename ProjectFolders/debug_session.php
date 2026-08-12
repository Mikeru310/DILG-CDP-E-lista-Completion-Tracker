<?php
session_start();

echo "<h2>Session Debug</h2>";
echo "<pre>";

if (empty($_SESSION)) {
    echo "❌ SESSION IS EMPTY\n\n";
    echo "Possible reasons:\n";
    echo "- You are NOT logged in\n";
    echo "- login.php did not set the session\n";
    echo "- You opened this page in a new browser / incognito\n";
    echo "- Apache was restarted (sessions cleared)\n";
} else {
    echo "✅ SESSION DATA FOUND:\n\n";
    print_r($_SESSION);
}

echo "</pre>";
