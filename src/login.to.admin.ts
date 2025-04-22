import dotenv from "dotenv";
dotenv.config();

const podUrl = process.env.POD_URL;
const username = process.env.EMAILORUSERNAME;
const password = process.env.PASSWORD;

const loginToAdmin = async () => {
    try {
        const loginResponse = await fetch(`${podUrl}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                usernameOrEmail: username,
                password: password
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status} - ${await loginResponse.text()}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;

        if (!token) {
            throw new Error("No token received from login response.");
        }

        // console.log("Login successful. Token:", token);
        return token;
    } catch (error: any) {
        console.error("Login error:", error.message);
        throw error;
    }
};

export { 
    loginToAdmin 
};
