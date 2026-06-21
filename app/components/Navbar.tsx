import { Link } from "react-router";

const Navbar = () => {
  return (
    <nav className="w-full h-20 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1e293b]">
              ResumeIQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI</span>
            </h1>
          </div>
        </Link>

        {/* CENTER LINKS */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <Link to="/upload" className="hover:text-blue-600 transition-colors">
            Upload
          </Link>
          <Link to="/reports" className="hover:text-blue-600 transition-colors">
            Reports
          </Link>
          <Link to="/profile" className="hover:text-blue-600 transition-colors">
            Profile
          </Link>
        </div>

        {/* RIGHT ACTION BUTTON */}
        <div className="flex items-center gap-4">
          <Link
            to="/upload"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm shadow-[0_4px_14px_0_rgb(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Upload Resume
          </Link>
        </div>
        
      </div>
    </nav>
  );
};

export default Navbar;