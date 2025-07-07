import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://week-5-web-sockets-assignment-khutso.onrender.com';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedForm = {
      email: form.email.trim(),
      password: form.password,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center w-full h-screen bg-gray-200">
      <div className="flex flex-col justify-center items-center w-70 h-80 p-4 bg-white rounded-xl">
        <h1 className="text-2xl text-gray-900 text-center font-bold mb-6">Login</h1>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="border border-[#797777] py-1.5 px-2 text-sm rounded focus:outline-[#949393]"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            className="border border-[#797777] py-1.5 px-2 text-sm rounded focus:outline-[#949393]"
          />

          <button
            type="submit"
            disabled={loading}
            className={`bg-gray-900 py-1.5 px-2 text-sm text-white cursor-pointer rounded-md duration-300 hover:bg-gray-800 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="flex justify-center items-center w-full mt-3">
          <p className="text-sm text-[#575757]">Don't have account?</p>
          <Link to="/signup" className="text-sm text-[#575757] font-semibold ml-1 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
