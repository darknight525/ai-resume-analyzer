import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { ServerRouter, UNSAFE_withComponentProps, Outlet, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, Meta, Links, ScrollRestoration, Scripts, Link, useNavigate, useLocation, useParams } from "react-router";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { create } from "zustand";
import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import { useDropzone } from "react-dropzone";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
const streamTimeout = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, routerContext, loadContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");
    let readyOption = userAgent && isbot(userAgent) || routerContext.isSpaMode ? "onAllReady" : "onShellReady";
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, streamTimeout + 1e3);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest,
  streamTimeout
}, Symbol.toStringTag, { value: "Module" }));
const getPuter = () => typeof window !== "undefined" && window.puter ? window.puter : null;
const usePuterStore = create((set, get) => {
  const setError = (msg) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser
      }
    });
  };
  const checkAuthStatus = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }
    set({ isLoading: true, error: null });
    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user
          },
          isLoading: false
        });
        return true;
      } else {
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null
          },
          isLoading: false
        });
        return false;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to check auth status";
      setError(msg);
      return false;
    }
  };
  const signIn = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setError(msg);
    }
  };
  const signOut = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await puter.auth.signOut();
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign out failed";
      setError(msg);
    }
  };
  const refreshUser = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const user = await puter.auth.getUser();
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user
        },
        isLoading: false
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh user";
      setError(msg);
    }
  };
  const init = () => {
    const puter = getPuter();
    if (puter) {
      set({ puterReady: true });
      checkAuthStatus();
      return;
    }
    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true });
        checkAuthStatus();
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) {
        setError("Puter.js failed to load within 10 seconds");
      }
    }, 1e4);
  };
  const write = async (path, data) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.write(path, data);
  };
  const readDir = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.readdir(path);
  };
  const readFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.read(path);
  };
  const upload2 = async (files) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.upload(files);
  };
  const deleteFile = async (path) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.fs.delete(path);
  };
  const chat = async (prompt, imageURL, testMode, options) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(prompt, imageURL, testMode, options);
  };
  const feedback = async (path, message) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.chat(
      [
        {
          role: "user",
          content: [
            {
              type: "file",
              puter_path: path
            },
            {
              type: "text",
              text: message
            }
          ]
        }
      ],
      { model: "gpt-4o" }
    );
  };
  const img2txt = async (image, testMode) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.ai.img2txt(image, testMode);
  };
  const getKV = async (key) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.get(key);
  };
  const setKV = async (key, value) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.set(key, value);
  };
  const deleteKV = async (key) => {
    const puter = getPuter();
    console.log("KV METHODS:", puter.kv);
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.delete(key);
  };
  const listKV = async (pattern, returnValues) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    if (returnValues === void 0) {
      returnValues = false;
    }
    return puter.kv.list(pattern, returnValues);
  };
  const flushKV = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }
    return puter.kv.flush();
  };
  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user
    },
    fs: {
      write: (path, data) => write(path, data),
      read: (path) => readFile(path),
      readDir: (path) => readDir(path),
      upload: (files) => upload2(files),
      delete: (path) => deleteFile(path)
    },
    ai: {
      chat: (prompt, imageURL, testMode, options) => chat(prompt, imageURL, testMode, options),
      feedback: (path, message) => feedback(path, message),
      img2txt: (image, testMode) => img2txt(image, testMode)
    },
    kv: {
      get: (key) => getKV(key),
      set: (key, value) => setKV(key, value),
      delete: (key) => deleteKV(key),
      list: (pattern, returnValues) => listKV(pattern, returnValues),
      flush: () => flushKV()
    },
    init,
    clearError: () => set({ error: null })
  };
});
const links = () => [{
  rel: "preconnect",
  href: "https://fonts.googleapis.com"
}, {
  rel: "preconnect",
  href: "https://fonts.gstatic.com",
  crossOrigin: "anonymous"
}, {
  rel: "stylesheet",
  href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
}];
function Layout({
  children
}) {
  const {
    init
  } = usePuterStore();
  useEffect(() => {
    init();
  }, [init]);
  return /* @__PURE__ */ jsxs("html", {
    lang: "en",
    children: [/* @__PURE__ */ jsxs("head", {
      children: [/* @__PURE__ */ jsx("meta", {
        charSet: "utf-8"
      }), /* @__PURE__ */ jsx("meta", {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }), /* @__PURE__ */ jsx(Meta, {}), /* @__PURE__ */ jsx(Links, {})]
    }), /* @__PURE__ */ jsxs("body", {
      children: [/* @__PURE__ */ jsx("script", {
        src: "https://js.puter.com/v2/"
      }), children, /* @__PURE__ */ jsx(ScrollRestoration, {}), /* @__PURE__ */ jsx(Scripts, {})]
    })]
  });
}
const root = UNSAFE_withComponentProps(function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
});
const ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary2({
  error
}) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack;
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  }
  return /* @__PURE__ */ jsxs("main", {
    className: "pt-16 p-4 container mx-auto",
    children: [/* @__PURE__ */ jsx("h1", {
      children: message
    }), /* @__PURE__ */ jsx("p", {
      children: details
    }), stack]
  });
});
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ErrorBoundary,
  Layout,
  default: root,
  links
}, Symbol.toStringTag, { value: "Module" }));
const Navbar = () => {
  return /* @__PURE__ */ jsxs("nav", { className: "navbar sticky top-0 z-50 bg-white/30 backdrop-blur-xl border-b border-white/20", children: [
    /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex flex-col", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent tracking-tight", children: "ResumeIQ AI" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 font-medium tracking-wide", children: "AI Resume Analysis & ATS Scoring" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-4", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/upload",
        className: "\r\n            px-6 py-3\r\n            rounded-xl\r\n            bg-gradient-to-r\r\n            from-blue-600\r\n            to-purple-600\r\n            text-white\r\n            font-semibold\r\n            shadow-lg\r\n            hover:shadow-xl\r\n            hover:scale-105\r\n            transition-all\r\n            duration-300\r\n          ",
        children: "Upload Resume"
      }
    ) })
  ] });
};
const ScoreCircle = ({ score = 75 }) => {
  const radius = 40;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = score / 100;
  const strokeDashoffset = circumference * (1 - progress);
  return /* @__PURE__ */ jsxs("div", { className: "relative w-[100px] h-[100px]", children: [
    /* @__PURE__ */ jsxs(
      "svg",
      {
        height: "100%",
        width: "100%",
        viewBox: "0 0 100 100",
        className: "transform -rotate-90",
        children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: "#e5e7eb",
              strokeWidth: stroke,
              fill: "transparent"
            }
          ),
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "grad", x1: "1", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#FF97AD" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#5171FF" })
          ] }) }),
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: normalizedRadius,
              stroke: "url(#grad)",
              strokeWidth: stroke,
              fill: "transparent",
              strokeDasharray: circumference,
              strokeDashoffset,
              strokeLinecap: "round"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "font-semibold text-sm", children: `${score}/100` }) })
  ] });
};
const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath }
}) => {
  const { fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");
  const handleDelete = async (e) => {
    e.preventDefault();
    console.log("Deleting:", id);
    const confirmDelete = window.confirm(
      "Delete this resume report?"
    );
    if (!confirmDelete) return;
    await kv.delete(`resume:${id}`);
    window.location.reload();
  };
  useEffect(() => {
    const loadResume = async () => {
      const blob = await fs.read(imagePath);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };
    loadResume();
  }, [imagePath, fs]);
  return /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/resume/${id}`,
      className: "\r\n  resume-card\r\n  bg-white/60\r\n  backdrop-blur-xl\r\n  border\r\n  border-white/30\r\n  animate-in\r\n  fade-in\r\n  duration-1000\r\n        transition-all\r\n        hover:-translate-y-2\r\n        hover:scale-[1.02]\r\n      ",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "resume-card-header", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleDelete,
              className: "\r\n    absolute\r\n    top-3\r\n    right-3\r\n    text-red-500\r\nhover:text-red-700\r\nfont-bold\r\ntext-lg\r\n    z-50\r\n  ",
              children: "✕"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
            companyName ? /* @__PURE__ */ jsx("h2", { className: "!text-black font-bold break-words", children: companyName }) : /* @__PURE__ */ jsx("h2", { className: "!text-black font-bold", children: "Resume" }),
            jobTitle && /* @__PURE__ */ jsx("h3", { className: "text-lg break-words text-gray-500", children: jobTitle }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-600 font-medium", children: "AI Resume Analysis" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: "• Recent" })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-shrink-0", children: /* @__PURE__ */ jsx(ScoreCircle, { score: (feedback == null ? void 0 : feedback.overallScore) || 0 }) })
        ] }),
        resumeUrl && /* @__PURE__ */ jsx("div", { className: "gradient-border animate-in fade-in duration-1000 overflow-hidden rounded-2xl", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: resumeUrl,
            alt: "resume",
            className: "\r\n                w-full\r\n                h-[350px]\r\n                max-sm:h-[200px]\r\n                object-cover\r\n                object-top\r\n                transition-transform\r\n                duration-500\r\n                hover:scale-105\r\n              "
          }
        ) }) })
      ]
    }
  );
};
function meta$2({}) {
  return [{
    title: "ResumeIQ AI"
  }, {
    name: "description",
    content: "AI Powered Resume Analysis & ATS Scoring"
  }];
}
const home = UNSAFE_withComponentProps(function Home() {
  const {
    auth: auth2,
    kv
  } = usePuterStore();
  console.log("AUTH:", auth2);
  console.log("IS AUTHENTICATED:", auth2.isAuthenticated);
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const totalResumes = resumes.length;
  const scores = resumes.map((resume2) => {
    var _a;
    return ((_a = resume2 == null ? void 0 : resume2.feedback) == null ? void 0 : _a.overallScore) || 0;
  });
  const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
  useEffect(() => {
    if (!auth2.isAuthenticated) navigate("/auth?next=/");
  }, [auth2.isAuthenticated]);
  useEffect(() => {
    const loadResumes = async () => {
      var _a;
      setLoadingResumes(true);
      const resumes2 = await kv.list("resume:*", true);
      console.log("RAW KV:", resumes2);
      const parsedResumes = resumes2 == null ? void 0 : resumes2.map((resume2) => JSON.parse(resume2.value));
      console.log("PARSED RESUMES:", parsedResumes);
      console.log(parsedResumes[0]);
      console.log("FEEDBACK DATA:", (_a = parsedResumes[0]) == null ? void 0 : _a.feedback);
      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    };
    loadResumes();
  }, []);
  return /* @__PURE__ */ jsxs("main", {
    className: "min-h-screen",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsxs("section", {
      className: "main-section relative z-10",
      children: [/* @__PURE__ */ jsxs("div", {
        className: "page-heading py-16 text-center",
        children: [/* @__PURE__ */ jsx("div", {
          className: "inline-block px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium mb-5",
          children: "🚀 AI Powered Resume Analyzer"
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-white/30 hover:scale-105 transition-all duration-300",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-gray-600 text-sm font-medium",
              children: "Total Resumes"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-5xl font-bold mt-2 text-gray-900",
              children: totalResumes
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-white/30 hover:scale-105 transition-all duration-300",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-gray-600 text-sm font-medium",
              children: "Average ATS Score"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-5xl font-bold mt-2 text-gray-900",
              children: averageScore
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl rounded-2xl p-6 text-center shadow-lg border border-white/30 hover:scale-105 transition-all duration-300",
            children: [/* @__PURE__ */ jsx("h3", {
              className: "text-gray-600 text-sm font-medium",
              children: "Best ATS Score"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-5xl font-bold mt-2 text-gray-900",
              children: bestScore
            })]
          })]
        }), /* @__PURE__ */ jsxs("h1", {
          className: "text-6xl md:text-7xl font-black leading-tight",
          children: ["Land More Interviews With", /* @__PURE__ */ jsx("span", {
            className: "block bg-gradient-to-r from-blue-600 via-cyan-500 to-purple-600 bg-clip-text text-transparent",
            children: "ResumeIQ AI"
          })]
        }), !loadingResumes && (resumes == null ? void 0 : resumes.length) === 0 ? /* @__PURE__ */ jsx("h2", {
          className: "text-xl text-gray-600 max-w-3xl mx-auto mt-6",
          children: "Analyze resumes with AI, calculate ATS scores, discover skill gaps, and receive personalized career recommendations instantly."
        }) : /* @__PURE__ */ jsx("h2", {
          className: "text-xl text-gray-700 mt-6",
          children: "Review your submissions, ATS scores and personalized AI feedback."
        }), /* @__PURE__ */ jsxs("div", {
          className: "flex justify-center gap-4 mt-8 flex-wrap",
          children: [/* @__PURE__ */ jsx(Link, {
            to: "/upload",
            className: "primary-button text-lg font-semibold",
            children: "Analyze Resume"
          }), /* @__PURE__ */ jsx("a", {
            href: "#reviews",
            className: "border px-6 py-3 rounded-xl font-medium",
            children: "View Reports"
          })]
        }), /* @__PURE__ */ jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(59,130,246,0.35)] hover:border-blue-300",
            children: [/* @__PURE__ */ jsx("div", {
              className: "text-4xl mb-3",
              children: "📊"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: "ATS Analysis"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 text-sm mt-2",
              children: "Measure resume compatibility with ATS systems."
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(34,197,94,0.35)] hover:border-purple-300",
            children: [/* @__PURE__ */ jsx("div", {
              className: "text-4xl mb-3",
              children: "🎯"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: "Skill Gap Detection"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 text-sm mt-2",
              children: "Discover missing skills for your target role."
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(34,197,94,0.35)] hover:border-green-300",
            children: [/* @__PURE__ */ jsx("div", {
              className: "text-4xl mb-3",
              children: "🤖"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: "AI Career Guidance"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 text-sm mt-2",
              children: "Personalized recommendations to improve your profile."
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-6 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-2",
            children: [/* @__PURE__ */ jsx("div", {
              className: "text-4xl mb-3",
              children: "🎤"
            }), /* @__PURE__ */ jsx("h3", {
              className: "font-bold text-lg",
              children: "Interview Prep"
            }), /* @__PURE__ */ jsx("p", {
              className: "text-gray-500 text-sm mt-2",
              children: "Generate interview questions based on your resume."
            })]
          })]
        })]
      }), loadingResumes && /* @__PURE__ */ jsxs("div", {
        className: "flex flex-col items-center justify-center",
        children: [/* @__PURE__ */ jsx("img", {
          src: "/images/resume-scan-2.gif",
          className: "w-[200px]"
        }), /* @__PURE__ */ jsx("p", {
          className: "mt-3 text-gray-500",
          children: "Loading your resume reports..."
        })]
      }), !loadingResumes && resumes.length > 0 && /* @__PURE__ */ jsxs(Fragment, {
        children: [/* @__PURE__ */ jsx("h2", {
          id: "reviews",
          className: "text-3xl font-bold text-center mb-8",
          children: "Your Resume Reports"
        }), /* @__PURE__ */ jsx("div", {
          className: "resumes-section",
          children: resumes.map((resume2) => /* @__PURE__ */ jsx(ResumeCard, {
            resume: resume2
          }, resume2.id))
        })]
      }), !loadingResumes && (resumes == null ? void 0 : resumes.length) === 0 && /* @__PURE__ */ jsx("div", {
        className: "flex flex-col items-center justify-center mt-10 gap-4",
        children: /* @__PURE__ */ jsx(Link, {
          to: "/upload",
          className: "primary-button w-fit text-xl font-semibold",
          children: "Upload Your First Resume"
        })
      }), !loadingResumes && (resumes == null ? void 0 : resumes.length) === 0 && /* @__PURE__ */ jsx("div", {
        children: "..."
      }), /* @__PURE__ */ jsxs("footer", {
        className: "mt-20 py-8 text-center border-t border-gray-200",
        children: [/* @__PURE__ */ jsx("h3", {
          className: "font-bold text-2xl text-gray-900",
          children: "ResumeIQ AI"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-700 font-medium mt-2",
          children: "AI Powered Resume Analysis & Career Guidance"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-500 text-sm mt-4",
          children: "Built with React, Tailwind CSS & AI"
        }), /* @__PURE__ */ jsx("p", {
          className: "text-gray-600 font-semibold mt-3",
          children: "Crafted with ❤️ by Nitin Singh"
        })]
      })]
    })]
  });
});
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: home,
  meta: meta$2
}, Symbol.toStringTag, { value: "Module" }));
const meta$1 = () => [{
  title: "Resumind | Auth"
}, {
  name: "description",
  content: "Log into your account"
}];
const Auth = () => {
  const {
    isLoading,
    auth: auth2
  } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1];
  const navigate = useNavigate();
  useEffect(() => {
    if (auth2.isAuthenticated) navigate(next);
  }, [auth2.isAuthenticated, next]);
  return /* @__PURE__ */ jsx("main", {
    className: "bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center",
    children: /* @__PURE__ */ jsx("div", {
      className: "gradient-border shadow-lg",
      children: /* @__PURE__ */ jsxs("section", {
        className: "flex flex-col gap-8 bg-white rounded-2xl p-10",
        children: [/* @__PURE__ */ jsxs("div", {
          className: "flex flex-col items-center gap-2 text-center",
          children: [/* @__PURE__ */ jsx("h1", {
            children: "Welcome"
          }), /* @__PURE__ */ jsx("h2", {
            children: "Log In to Continue Your Job Journey"
          })]
        }), /* @__PURE__ */ jsx("div", {
          children: isLoading ? /* @__PURE__ */ jsx("button", {
            className: "auth-button animate-pulse",
            children: /* @__PURE__ */ jsx("p", {
              children: "Signing you in..."
            })
          }) : /* @__PURE__ */ jsx(Fragment, {
            children: auth2.isAuthenticated ? /* @__PURE__ */ jsx("button", {
              className: "auth-button",
              onClick: auth2.signOut,
              children: /* @__PURE__ */ jsx("p", {
                children: "Log Out"
              })
            }) : /* @__PURE__ */ jsx("button", {
              className: "auth-button",
              onClick: auth2.signIn,
              children: /* @__PURE__ */ jsx("p", {
                children: "Log In"
              })
            })
          })
        })]
      })
    })
  });
};
const auth = UNSAFE_withComponentProps(Auth);
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: auth,
  meta: meta$1
}, Symbol.toStringTag, { value: "Module" }));
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
const generateUUID = () => crypto.randomUUID();
const FileUploader = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles2) => {
    const file2 = acceptedFiles2[0] || null;
    onFileSelect == null ? void 0 : onFileSelect(file2);
  }, [onFileSelect]);
  const maxFileSize = 20 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize: maxFileSize
  });
  const file = acceptedFiles[0] || null;
  return /* @__PURE__ */ jsx("div", { className: "w-full gradient-border", children: /* @__PURE__ */ jsxs("div", { ...getRootProps(), children: [
    /* @__PURE__ */ jsx("input", { ...getInputProps() }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4 cursor-pointer", children: file ? /* @__PURE__ */ jsxs("div", { className: "uploader-selected-file", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsx("img", { src: "/images/pdf.png", alt: "pdf", className: "size-10" }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center space-x-3", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-700 truncate max-w-xs", children: file.name }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: formatSize(file.size) })
      ] }) }),
      /* @__PURE__ */ jsx("button", { className: "p-2 cursor-pointer", onClick: (e) => {
        onFileSelect == null ? void 0 : onFileSelect(null);
      }, children: /* @__PURE__ */ jsx("img", { src: "/icons/cross.svg", alt: "remove", className: "w-4 h-4" }) })
    ] }) : /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-16 h-16 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsx("img", { src: "/icons/info.svg", alt: "upload", className: "size-20" }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-lg text-gray-500", children: [
        /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Click to upload" }),
        " or drag and drop"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-lg text-gray-500", children: [
        "PDF (max ",
        formatSize(maxFileSize),
        ")"
      ] })
    ] }) })
  ] }) });
};
let pdfjsLib = null;
let loadPromise = null;
async function loadPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsLib = lib;
    return lib;
  });
  return loadPromise;
}
async function convertPdfToImage(file) {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }
    await page.render({ canvasContext: context, viewport }).promise;
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png"
            });
            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob"
            });
          }
        },
        "image/png",
        1
      );
    });
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err}`
    };
  }
}
const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;
const prepareInstructions = ({ jobTitle, jobDescription }) => `
You are an ATS Resume Analyzer.

Analyze the resume for the role below.

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Return ONLY valid JSON using this format:
${AIResponseFormat}

Keep feedback concise.
Maximum 2 strengths.
Maximum 2 weaknesses.
Maximum 3 suggestions.
Do not write long explanations.
`;
const Upload = () => {
  const {
    auth: auth2,
    isLoading,
    fs,
    ai,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState(null);
  const handleFileSelect = (file2) => {
    setFile(file2);
  };
  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file: file2
  }) => {
    console.log("HANDLE ANALYZE STARTED");
    setIsProcessing(true);
    setStatusText("Uploading the file...");
    const uploadedFile = await fs.upload([file2]);
    if (!uploadedFile) return setStatusText("Error: Failed to upload file");
    setStatusText("Converting to image...");
    const imageFile = await convertPdfToImage(file2);
    if (!imageFile.file) return setStatusText("Error: Failed to convert PDF to image");
    setStatusText("Uploading the image...");
    const uploadedImage = await fs.upload([imageFile.file]);
    if (!uploadedImage) return setStatusText("Error: Failed to upload image");
    setStatusText("Preparing data...");
    const uuid = generateUUID();
    const data = {
      id: uuid,
      resumePath: uploadedFile.path,
      imagePath: uploadedImage.path,
      companyName,
      jobTitle,
      jobDescription,
      feedback: ""
    };
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    setStatusText("Generating AI Feedback...");
    console.time("AI Analysis");
    let feedback;
    try {
      feedback = await ai.feedback(uploadedFile.path, prepareInstructions({
        jobTitle,
        jobDescription
      }));
      console.log("AI RESPONSE:", feedback);
    } catch (error) {
      console.error("AI ERROR:", JSON.stringify(error, null, 2));
      alert(JSON.stringify(error, null, 2));
      return;
    }
    console.timeEnd("AI Analysis");
    if (!feedback) return setStatusText("Error: Failed to analyze resume");
    const feedbackText = typeof feedback.message.content === "string" ? feedback.message.content : feedback.message.content[0].text;
    console.log("FEEDBACK TEXT:", feedbackText);
    alert(feedbackText);
    const cleanJson = feedbackText.replace(/```json/g, "").replace(/```/g, "").trim();
    data.feedback = JSON.parse(cleanJson);
    console.log("PARSED FEEDBACK:", data.feedback);
    await kv.set(`resume:${uuid}`, JSON.stringify(data));
    console.log("SAVED TO KV");
    setStatusText("Analysis complete, redirecting...");
    console.log(data);
    navigate(`/resume/${uuid}`);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;
    const formData = new FormData(form);
    const companyName = formData.get("company-name");
    const jobTitle = formData.get("job-title");
    const jobDescription = formData.get("job-description");
    if (!companyName || !jobTitle || !jobDescription) {
      alert("Please fill all fields");
      return;
    }
    if (!file) {
      alert("Please upload your resume");
      return;
    }
    handleAnalyze({
      companyName,
      jobTitle,
      jobDescription,
      file
    });
  };
  return /* @__PURE__ */ jsxs("main", {
    className: "bg-[url('/images/bg-main.svg')] bg-cover",
    children: [/* @__PURE__ */ jsx(Navbar, {}), /* @__PURE__ */ jsx("section", {
      className: "main-section",
      children: /* @__PURE__ */ jsxs("div", {
        className: "page-heading py-16",
        children: [/* @__PURE__ */ jsx("h1", {
          children: "Land More Interviews with AI-Powered Resume Analysis"
        }), isProcessing ? /* @__PURE__ */ jsxs(Fragment, {
          children: [/* @__PURE__ */ jsx("h2", {
            children: statusText
          }), /* @__PURE__ */ jsx("img", {
            src: "/images/resume-scan.gif",
            className: "w-full"
          })]
        }) : /* @__PURE__ */ jsx("h2", {
          children: "Get ATS Score, Skill Gap Analysis, Resume Feedback and Career Recommendations."
        }), !isProcessing && /* @__PURE__ */ jsxs("form", {
          id: "upload-form",
          onSubmit: handleSubmit,
          className: "flex flex-col gap-4 mt-8",
          children: [/* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "company-name",
              children: "Company Name"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              name: "company-name",
              placeholder: "Company Name",
              id: "company-name"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "job-title",
              children: "Job Title"
            }), /* @__PURE__ */ jsx("input", {
              type: "text",
              name: "job-title",
              placeholder: "Job Title",
              id: "job-title"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "job-description",
              children: "Job Description"
            }), /* @__PURE__ */ jsx("textarea", {
              rows: 5,
              name: "job-description",
              placeholder: "Job Description",
              id: "job-description"
            })]
          }), /* @__PURE__ */ jsxs("div", {
            className: "form-div",
            children: [/* @__PURE__ */ jsx("label", {
              htmlFor: "uploader",
              children: "Upload Resume"
            }), /* @__PURE__ */ jsx(FileUploader, {
              onFileSelect: handleFileSelect
            })]
          }), /* @__PURE__ */ jsx("button", {
            className: "primary-button",
            type: "submit",
            disabled: isProcessing,
            children: isProcessing ? "Analyzing..." : "Analyze Resume"
          })]
        })]
      })
    })]
  });
};
const upload = UNSAFE_withComponentProps(Upload);
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: upload
}, Symbol.toStringTag, { value: "Module" }));
const ScoreGauge = ({ score = 75 }) => {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef(null);
  const percentage = score / 100;
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col items-center", children: /* @__PURE__ */ jsxs("div", { className: "relative w-40 h-20", children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 100 50", className: "w-full h-full", children: [
      /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs(
        "linearGradient",
        {
          id: "gaugeGradient",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "0%",
          children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "#a78bfa" }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "#fca5a5" })
          ]
        }
      ) }),
      /* @__PURE__ */ jsx(
        "path",
        {
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "#e5e7eb",
          strokeWidth: "10",
          strokeLinecap: "round"
        }
      ),
      /* @__PURE__ */ jsx(
        "path",
        {
          ref: pathRef,
          d: "M10,50 A40,40 0 0,1 90,50",
          fill: "none",
          stroke: "url(#gaugeGradient)",
          strokeWidth: "10",
          strokeLinecap: "round",
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength * (1 - percentage)
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center pt-2", children: /* @__PURE__ */ jsxs("div", { className: "text-xl font-semibold pt-4", children: [
      score,
      "/100"
    ] }) })
  ] }) });
};
const ScoreBadge$1 = ({ score }) => {
  let badgeColor = "";
  let badgeText = "";
  if (score > 70) {
    badgeColor = "bg-badge-green text-green-600";
    badgeText = "Strong";
  } else if (score > 49) {
    badgeColor = "bg-badge-yellow text-yellow-600";
    badgeText = "Good Start";
  } else {
    badgeColor = "bg-badge-red text-red-600";
    badgeText = "Needs Work";
  }
  return /* @__PURE__ */ jsx("div", { className: `px-3 py-1 rounded-full ${badgeColor}`, children: /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: badgeText }) });
};
const Category = ({
  title,
  score,
  tips
}) => {
  const textColor = score > 70 ? "text-green-600" : score > 49 ? "text-yellow-600" : "text-red-600";
  return /* @__PURE__ */ jsx("div", { className: "resume-summary", children: /* @__PURE__ */ jsxs("div", { className: "category", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center justify-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-2xl", children: title }),
      /* @__PURE__ */ jsx(ScoreBadge$1, { score })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-2xl", children: [
      /* @__PURE__ */ jsx("span", { className: textColor, children: score }),
      "/100"
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-4", children: tips == null ? void 0 : tips.map((tip, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "mb-4 p-3 border rounded-lg bg-gray-50",
        children: [
          /* @__PURE__ */ jsxs("p", { className: "font-semibold", children: [
            tip.type === "good" ? "✅" : "⚠️",
            " ",
            tip.tip
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: tip.explanation })
        ]
      },
      index
    )) })
  ] }) });
};
const Summary = ({ feedback }) => {
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-md w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-row items-center p-4 gap-8", children: [
      /* @__PURE__ */ jsx(ScoreGauge, { score: feedback.overallScore }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: "Your Resume Score" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "This score is calculated based on the variables listed below." })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      Category,
      {
        title: "Tone & Style",
        score: feedback.toneAndStyle.score,
        tips: feedback.toneAndStyle.tips
      }
    ),
    /* @__PURE__ */ jsx(
      Category,
      {
        title: "Content",
        score: feedback.content.score,
        tips: feedback.content.tips
      }
    ),
    /* @__PURE__ */ jsx(
      Category,
      {
        title: "Structure",
        score: feedback.structure.score,
        tips: feedback.structure.tips
      }
    ),
    /* @__PURE__ */ jsx(
      Category,
      {
        title: "Skills",
        score: feedback.skills.score,
        tips: feedback.skills.tips
      }
    )
  ] });
};
const ATS = ({ score, suggestions }) => {
  const gradientClass = score > 69 ? "from-green-100" : score > 49 ? "from-yellow-100" : "from-red-100";
  const iconSrc = score > 69 ? "/icons/ats-good.svg" : score > 49 ? "/icons/ats-warning.svg" : "/icons/ats-bad.svg";
  const subtitle = score > 69 ? "Great Job!" : score > 49 ? "Good Start" : "Needs Improvement";
  return /* @__PURE__ */ jsxs("div", { className: `bg-gradient-to-b ${gradientClass} to-white rounded-2xl shadow-md w-full p-6`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-6", children: [
      /* @__PURE__ */ jsx("img", { src: iconSrc, alt: "ATS Score Icon", className: "w-12 h-12" }),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold", children: [
        "ATS Score - ",
        score,
        "/100"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: subtitle }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4", children: "This score represents how well your resume is likely to perform in Applicant Tracking Systems used by employers." }),
      /* @__PURE__ */ jsx("div", { className: "space-y-3", children: suggestions.map((suggestion, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
            alt: suggestion.type === "good" ? "Check" : "Warning",
            className: "w-5 h-5 mt-1"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: suggestion.type === "good" ? "text-green-700" : "text-amber-700", children: suggestion.tip })
      ] }, index)) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-700 italic", children: "Keep refining your resume to improve your chances of getting past ATS filters and into the hands of recruiters." })
  ] });
};
const AccordionContext = createContext(
  void 0
);
const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
};
const Accordion = ({
  children,
  defaultOpen,
  allowMultiple = false,
  className = ""
}) => {
  const [activeItems, setActiveItems] = useState(
    defaultOpen ? [defaultOpen] : []
  );
  const toggleItem = (id) => {
    setActiveItems((prev) => {
      if (allowMultiple) {
        return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      } else {
        return prev.includes(id) ? [] : [id];
      }
    });
  };
  const isItemActive = (id) => activeItems.includes(id);
  return /* @__PURE__ */ jsx(
    AccordionContext.Provider,
    {
      value: { activeItems, toggleItem, isItemActive },
      children: /* @__PURE__ */ jsx("div", { className: `space-y-2 ${className}`, children })
    }
  );
};
const AccordionItem = ({
  id,
  children,
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `overflow-hidden border-b border-gray-200 ${className}`, children });
};
const AccordionHeader = ({
  itemId,
  children,
  className = "",
  icon,
  iconPosition = "right"
}) => {
  const { toggleItem, isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  const defaultIcon = /* @__PURE__ */ jsx(
    "svg",
    {
      className: cn("w-5 h-5 transition-transform duration-200", {
        "rotate-180": isActive
      }),
      fill: "none",
      stroke: "#98A2B3",
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M19 9l-7 7-7-7"
        }
      )
    }
  );
  const handleClick = () => {
    toggleItem(itemId);
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleClick,
      className: `
        w-full px-4 py-3 text-left
        focus:outline-none
        transition-colors duration-200 flex items-center justify-between cursor-pointer
        ${className}
      `,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center space-x-3", children: [
          iconPosition === "left" && (icon || defaultIcon),
          /* @__PURE__ */ jsx("div", { className: "flex-1", children })
        ] }),
        iconPosition === "right" && (icon || defaultIcon)
      ]
    }
  );
};
const AccordionContent = ({
  itemId,
  children,
  className = ""
}) => {
  const { isItemActive } = useAccordion();
  const isActive = isItemActive(itemId);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: `
        overflow-hidden transition-all duration-300 ease-in-out
        ${isActive ? "max-h-fit opacity-100" : "max-h-0 opacity-0"}
        ${className}
      `,
      children: /* @__PURE__ */ jsx("div", { className: "px-4 py-3 ", children })
    }
  );
};
const ScoreBadge = ({ score }) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-row gap-1 items-center px-2 py-0.5 rounded-[96px]",
        score > 69 ? "bg-badge-green" : score > 39 ? "bg-badge-yellow" : "bg-badge-red"
      ),
      children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: score > 69 ? "/icons/check.svg" : "/icons/warning.svg",
            alt: "score",
            className: "size-4"
          }
        ),
        /* @__PURE__ */ jsxs(
          "p",
          {
            className: cn(
              "text-sm font-medium",
              score > 69 ? "text-badge-green-text" : score > 39 ? "text-badge-yellow-text" : "text-badge-red-text"
            ),
            children: [
              score,
              "/100"
            ]
          }
        )
      ]
    }
  );
};
const CategoryHeader = ({
  title,
  categoryScore
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-4 items-center py-2", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-semibold", children: title }),
    /* @__PURE__ */ jsx(ScoreBadge, { score: categoryScore })
  ] });
};
const CategoryContent = ({
  tips
}) => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 items-center w-full", children: [
    /* @__PURE__ */ jsx("div", { className: "bg-gray-50 w-full rounded-lg px-5 py-4 grid grid-cols-2 gap-4", children: tips.map((tip, index) => /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
          alt: "score",
          className: "size-5"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-gray-500 ", children: tip.tip })
    ] }, index)) }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 w-full", children: tips.map((tip, index) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "flex flex-col gap-2 rounded-2xl p-4",
          tip.type === "good" ? "bg-green-50 border border-green-200 text-green-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"
        ),
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-2 items-center", children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: tip.type === "good" ? "/icons/check.svg" : "/icons/warning.svg",
                alt: "score",
                className: "size-5"
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "text-xl font-semibold", children: tip.tip })
          ] }),
          /* @__PURE__ */ jsx("p", { children: tip.explanation })
        ]
      },
      index + tip.tip
    )) })
  ] });
};
const Details = ({ feedback }) => {
  return /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-4 w-full", children: /* @__PURE__ */ jsxs(Accordion, { children: [
    /* @__PURE__ */ jsxs(AccordionItem, { id: "tone-style", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "tone-style", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Tone & Style",
          categoryScore: feedback.toneAndStyle.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "tone-style", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.toneAndStyle.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "content", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "content", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Content",
          categoryScore: feedback.content.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "content", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.content.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "structure", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "structure", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Structure",
          categoryScore: feedback.structure.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "structure", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.structure.tips }) })
    ] }),
    /* @__PURE__ */ jsxs(AccordionItem, { id: "skills", children: [
      /* @__PURE__ */ jsx(AccordionHeader, { itemId: "skills", children: /* @__PURE__ */ jsx(
        CategoryHeader,
        {
          title: "Skills",
          categoryScore: feedback.skills.score
        }
      ) }),
      /* @__PURE__ */ jsx(AccordionContent, { itemId: "skills", children: /* @__PURE__ */ jsx(CategoryContent, { tips: feedback.skills.tips }) })
    ] })
  ] }) });
};
const meta = () => [{
  title: "Resumind | Review "
}, {
  name: "description",
  content: "Detailed overview of your resume"
}];
const Resume = () => {
  const {
    auth: auth2,
    isLoading,
    fs,
    kv
  } = usePuterStore();
  const {
    id
  } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);
  useEffect(() => {
    const loadResume = async () => {
      console.time("Total Load");
      const resume2 = await kv.get(`resume:${id}`);
      if (!resume2) return;
      const data = JSON.parse(resume2);
      console.time("Read PDF");
      const resumeBlob = await fs.read(data.resumePath);
      console.timeEnd("Read PDF");
      if (!resumeBlob) return;
      const pdfBlob = new Blob([resumeBlob], {
        type: "application/pdf"
      });
      const resumeUrl2 = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl2);
      console.time("Read Image");
      const imageBlob = await fs.read(data.imagePath);
      console.timeEnd("Read Image");
      if (!imageBlob) return;
      const imageUrl2 = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl2);
      setFeedback(data.feedback);
      console.timeEnd("Total Load");
    };
    loadResume();
  }, [id]);
  return /* @__PURE__ */ jsxs("main", {
    className: "!pt-0",
    children: [/* @__PURE__ */ jsx("nav", {
      className: "resume-nav",
      children: /* @__PURE__ */ jsxs(Link, {
        to: "/",
        className: "back-button",
        children: [/* @__PURE__ */ jsx("img", {
          src: "/icons/back.svg",
          alt: "logo",
          className: "w-2.5 h-2.5"
        }), /* @__PURE__ */ jsx("span", {
          className: "text-gray-800 text-sm font-semibold",
          children: "Back to Homepage"
        })]
      })
    }), /* @__PURE__ */ jsxs("div", {
      className: "flex flex-row w-full max-lg:flex-col-reverse",
      children: [/* @__PURE__ */ jsx("section", {
        className: "feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center",
        children: imageUrl && resumeUrl && /* @__PURE__ */ jsx("div", {
          className: "animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit",
          children: /* @__PURE__ */ jsx("a", {
            href: resumeUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            children: /* @__PURE__ */ jsx("img", {
              src: imageUrl,
              className: "w-full h-full object-contain rounded-2xl",
              title: "resume"
            })
          })
        })
      }), /* @__PURE__ */ jsxs("section", {
        className: "feedback-section",
        children: [/* @__PURE__ */ jsx("h2", {
          className: "text-4xl !text-black font-bold",
          children: "Resume Review"
        }), feedback ? /* @__PURE__ */ jsxs("div", {
          className: "flex flex-col gap-8 animate-in fade-in duration-1000",
          children: [/* @__PURE__ */ jsx(Summary, {
            feedback
          }), /* @__PURE__ */ jsx(ATS, {
            score: feedback.ATS.score || 0,
            suggestions: feedback.ATS.tips || []
          }), /* @__PURE__ */ jsx(Details, {
            feedback
          })]
        }) : /* @__PURE__ */ jsx("img", {
          src: "/images/resume-scan-2.gif",
          className: "w-full"
        })]
      })]
    })]
  });
};
const resume = UNSAFE_withComponentProps(Resume);
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: resume,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const WipeApp = () => {
  var _a;
  const {
    auth: auth2,
    isLoading,
    error,
    clearError,
    fs,
    ai,
    kv
  } = usePuterStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const loadFiles = async () => {
    const files2 = await fs.readDir("./");
    setFiles(files2);
  };
  useEffect(() => {
    loadFiles();
  }, []);
  useEffect(() => {
    if (!isLoading && !auth2.isAuthenticated) {
      navigate("/auth?next=/wipe");
    }
  }, [isLoading]);
  const handleDelete = async () => {
    files.forEach(async (file) => {
      await fs.delete(file.path);
    });
    await kv.flush();
    loadFiles();
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", {
      children: "Loading..."
    });
  }
  if (error) {
    return /* @__PURE__ */ jsxs("div", {
      children: ["Error ", error]
    });
  }
  return /* @__PURE__ */ jsxs("div", {
    children: ["Authenticated as: ", (_a = auth2.user) == null ? void 0 : _a.username, /* @__PURE__ */ jsx("div", {
      children: "Existing files:"
    }), /* @__PURE__ */ jsx("div", {
      className: "flex flex-col gap-4",
      children: files.map((file) => /* @__PURE__ */ jsx("div", {
        className: "flex flex-row gap-4",
        children: /* @__PURE__ */ jsx("p", {
          children: file.name
        })
      }, file.id))
    }), /* @__PURE__ */ jsx("div", {
      children: /* @__PURE__ */ jsx("button", {
        className: "bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer",
        onClick: () => handleDelete(),
        children: "Wipe App Data"
      })
    })]
  });
};
const wipe = UNSAFE_withComponentProps(WipeApp);
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: wipe
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-DQFzWzMJ.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": true, "module": "/assets/root-7_bJOHI-.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/puter-CUm-GsHB.js"], "css": ["/assets/root-CgmHVVcW.css"], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/home": { "id": "routes/home", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/home-CpXtxyXM.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/Navbar-QTlI8JIg.js", "/assets/puter-CUm-GsHB.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/auth": { "id": "routes/auth", "parentId": "root", "path": "/auth", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/auth-G-Mbqo9q.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/puter-CUm-GsHB.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/upload": { "id": "routes/upload", "parentId": "root", "path": "/upload", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/upload-DiKd_wNd.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/Navbar-QTlI8JIg.js", "/assets/utils-CLdLQqWL.js", "/assets/puter-CUm-GsHB.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/resume": { "id": "routes/resume", "parentId": "root", "path": "/resume/:id", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/resume-Dyz-cK-1.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/puter-CUm-GsHB.js", "/assets/utils-CLdLQqWL.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 }, "routes/wipe": { "id": "routes/wipe", "parentId": "root", "path": "/wipe", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasClientMiddleware": false, "hasErrorBoundary": false, "module": "/assets/wipe-BiykNfiX.js", "imports": ["/assets/chunk-QMGIS6GS-DX0VMMAr.js", "/assets/puter-CUm-GsHB.js"], "css": [], "clientActionModule": void 0, "clientLoaderModule": void 0, "clientMiddlewareModule": void 0, "hydrateFallbackModule": void 0 } }, "url": "/assets/manifest-6fd2f164.js", "version": "6fd2f164", "sri": void 0 };
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "unstable_middleware": false, "unstable_optimizeDeps": false, "unstable_splitRouteModules": false, "unstable_subResourceIntegrity": false, "unstable_viteEnvironmentApi": false };
const ssr = true;
const isSpaMode = false;
const prerender = [];
const routeDiscovery = { "mode": "lazy", "manifestPath": "/__manifest" };
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/auth": {
    id: "routes/auth",
    parentId: "root",
    path: "/auth",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/upload": {
    id: "routes/upload",
    parentId: "root",
    path: "/upload",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/resume": {
    id: "routes/resume",
    parentId: "root",
    path: "/resume/:id",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/wipe": {
    id: "routes/wipe",
    parentId: "root",
    path: "/wipe",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  prerender,
  publicPath,
  routeDiscovery,
  routes,
  ssr
};
