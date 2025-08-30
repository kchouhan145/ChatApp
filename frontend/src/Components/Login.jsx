import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setAuthUser } from '../redux/userSlice'

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: '',
        password: ''
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await axios.post(
                `https://dczone.onrender.com/api/v1/user/login`,
                user,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            // console.log("Server Response:", res.data);
            dispatch(setAuthUser(res.data));
            // console.log(res.data);
            if (res.data) {
                navigate("/");
                toast.success(`Welcome ${res.data.username}`);
            }
        } catch (error) {
            console.error("Error during login:", error);
        }
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-6">
            <div className='pb-2 bg-[#5754E8] md:w-98 rounded-b-lg shadow-xl rounded-t-lg'>
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl font-bold text-center mb-6 justify-center">Welcome Back!</h2>
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className="label-text">Username</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={user.username}
                                    onChange={(e) => setUser({ ...user, username: e.target.value })}
                                    placeholder="Enter your username"
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

                            <button type="submit" className="btn btn-primary w-full mt-6 sm:mt-8">
                                Login
                            </button>
                        </form>

                        <div className="divider my-4">OR</div>

                        <p className="text-center text-sm sm:text-base">
                            New to ChatApp?{' '}
                            <Link to="/signup" className="text-primary hover:underline font-medium">
                                Create an account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
