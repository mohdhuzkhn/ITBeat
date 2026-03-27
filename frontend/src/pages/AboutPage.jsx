import { Link } from "react-router-dom";

const STACK = [
  {
    label: "Frontend",
    items: [
      "React 18",
      "Vite",
      "TanStack Query",
      "Tailwind CSS",
      "React Router v6",
    ],
  },
  {
    label: "Backend",
    items: [
      "Node.js",
      "Express.js",
      "PostgreSQL",
      "JWT Auth",
      "Zod Validation",
    ],
  },
  {
    label: "Infra",
    items: ["Vercel (frontend)", "Railway (backend + DB)", "GitHub OAuth"],
  },
];

const FEATURES = [
  {
    icon: "📰",
    title: "Community Posts",
    desc: "Submit IT news across AI, Cloud, Security, Web Dev and more.",
  },
  {
    icon: "🔔",
    title: "Notifications",
    desc: "Get notified instantly when someone likes or comments on your post.",
  },
  {
    icon: "🛡️",
    title: "Moderation",
    desc: "Trusted moderation pipeline keeps content quality high.",
  },
  {
    icon: "🔍",
    title: "Search & Filter",
    desc: "Find posts by category or search across titles and content.",
  },
  {
    icon: "🐙",
    title: "GitHub Login",
    desc: "Sign in instantly with your GitHub account — no password needed.",
  },
  {
    icon: "👤",
    title: "User Profiles",
    desc: "See any user's posts, liked content, and comments in one place.",
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Hero */}
      <div className="card p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">ITBeat</h1>
        <p className="text-gray-500 text-sm mb-4">
          A community-driven IT news platform
        </p>
        <p className="text-gray-700 leading-relaxed">
          ITBeat is a focused space for IT professionals and enthusiasts to
          share, discover, and discuss the latest technology updates. No
          algorithms, no ads — just real content from real people in the tech
          community.
        </p>
        <div className="flex justify-center gap-3 mt-6">
          <Link to="/" className="btn-primary text-sm px-5">
            Browse Feed
          </Link>
          <Link to="/register" className="btn-ghost text-sm px-5">
            Join ITBeat
          </Link>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          What you can do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{f.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Built with</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STACK.map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                {s.label}
              </p>
              <ul className="space-y-1">
                {s.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-gray-600 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center pb-6">
        <p className="text-xs text-gray-400">
          Built with ❤️ — ITBeat © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
