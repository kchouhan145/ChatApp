import jwt from 'jsonwebtoken';

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing' });
        }
        console.log(token);
        const decode = await jwt.verify(token,process.env.JWT_KEY);
        if(!decode){
            return res.status(401).json({
                message:"Token is not valid"
            })
        };
        req.id = decode.userId;
        console.log(decode);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid authentication token' });
    }
};

export default isAuthenticated;