import { useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner';

const SignUp = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        gender: "male"
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log("Form Submitted!", user);

        // Basic validation
        if (user.password !== user.confirmPassword) {
            console.log("Passwords do not match!");
            return;
        }

        try {
            const res = await axios.post(
                `http://localhost:8080/api/v1/user/register`,
                user,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            // console.log("Server Response:", res.data);
            if(res.data.success){
                navigate("/login");
                toast.success(`${res.data.message}`);
            }
        } catch (error) {
            console.error("Error during signup:", error);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-6">
            <div className='pb-2 bg-[#5754E8] md:w-98 rounded-b-lg shadow-xl rounded-t-lg'>
                <div className="card w-full max-w-md bg-base-100">
                <div className="card-body">
                    <h2 className="card-title text-2xl font-bold text-center mb-4 justify-center">Sign Up</h2>
                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Name</span>
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={user.fullName}
                                onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                                placeholder="Enter your name"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={user.username}
                                onChange={(e) => setUser({ ...user, username: e.target.value })}
                                placeholder="Enter Username"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Password</span>
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={user.password}
                                onChange={(e) => setUser({ ...user, password: e.target.value })}
                                placeholder="Enter your password"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Confirm Password</span>
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={user.confirmPassword}
                                onChange={(e) => setUser({ ...user, confirmPassword: e.target.value })}
                                placeholder="Confirm your password"
                                className="input input-bordered w-full"
                                required
                            />
                        </div>

                        <div className="form-control w-full mt-4">
                            <label className="label">
                                <span className="label-text">Gender</span>
                            </label>
                            <div className="flex flex-wrap gap-4 sm:gap-6">
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={user.gender === 'male'}
                                        onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                        className="radio radio-primary"
                                    />
                                    <span className="label-text">Male</span>
                                </label>
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={user.gender === 'female'}
                                        onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                        className="radio radio-primary"
                                    />
                                    <span className="label-text">Female</span>
                                </label>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-5 sm:mt-6">
                            Sign Up
                        </button>
                    </form>
                    <div className="divider my-4">OR</div>

                    <p className="text-center mt-4 text-sm sm:text-base">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline font-medium">
                            Login here
                        </Link>
                    </p>
                </div>
            </div>
            </div>
        </div>
    );
};

export default SignUp;
