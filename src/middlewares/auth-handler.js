import jwt from "jsonwebtoken";

const authHandler = (
    req,
    res,
    next
) => {

    let JWT_SECRET = process.env.JWT_SECRET;

    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers.authorization;
        token = authHeader?.split(" ")[1];
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: "No JWT secret provided" });
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).json({ error: "Invalid or expired token" });
        }
    } else {
        return res.status(401).json({ error: "No token provided" });
    }

    next();
};

export default authHandler;