import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Use environment variable for API base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mern-week5-assignment.onrender.com';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trimmedForm = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmedForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      alert('Signup successful! Please login.');
      setForm({ name: '', email: '', password: '' });  // Clear form
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center w-full h-screen bg-gray-200">
      <div className="flex flex-col justify-center items-center w-70 h-80 p-4 bg-white rounded-xl">
        <h1 className="text-2xl text-gray-900 text-center font-bold mb-6">Sign Up</h1>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            className="border border-[#797777] py-1.5 px-2 text-sm rounded focus:outline-[#949393]"
          />
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
            disabled={loading}
            type="submit"
            className={`bg-gray-900 text-white cursor-pointer py-1.5 px-2 text-sm rounded hover:bg-gray-800 duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>

        <div className="flex justify-center items-center w-full mt-3">
          <p className="text-sm text-[#575757]">Have account?</p>
          <Link to="/login" className="text-sm text-[#575757] font-semibold ml-1 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
