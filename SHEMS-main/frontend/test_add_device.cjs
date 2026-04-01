const axios = require('axios');
async function test() {
  let token;
  try {
     await axios.post('http://localhost:8082/api/auth/register', { fullName: "Test User", email: "test2@example.com", password: "password123" });
  } catch(e){}
  
  try {
    const login = (await axios.post('http://localhost:8082/api/auth/login', { email: "test2@example.com", password: "password123" })).data;
    token = login.token;
  } catch(e) { console.log('Login failed', e.response?.data); return; }
  
  try {
    const res = await axios.post('http://localhost:8082/api/devices', { name: "Test Device", type: "FAN", powerRating: 50 }, { headers: { Authorization: "Bearer " + token }});
    console.log("ADD DEVICE SUCCESS:", res.data);
  } catch (e) {
    console.log("ADD DEVICE ERROR:", e.response ? e.response.data : e.message);
  }
}
test();
