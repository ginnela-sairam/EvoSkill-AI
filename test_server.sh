PORT=3002 npx tsx server.ts > server_test.log 2>&1 &
SERVER_PID=$!
sleep 5
curl -X POST -H "Content-Type: application/json" -d '{"chatHistory":[{"role":"user","content":"I want to be a software engineer"}]}' http://localhost:3002/api/generate-roadmap
kill $SERVER_PID
