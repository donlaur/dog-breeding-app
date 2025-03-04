#!/bin/bash
echo "Restarting both server and client..."
cd "$(dirname "$0")"

# Run the individual restart scripts
./restart-server.sh
./restart-client.sh

echo "Done! Both server and client have been restarted."