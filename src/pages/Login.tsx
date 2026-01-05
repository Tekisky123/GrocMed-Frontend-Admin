import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AlertCircle, Loader2, User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import logo from "@/assets/logo-removebg-preview.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Relaxed validation: just check for empty fields
  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden bg-slate-50">
      {/* Background Gradients using Brand Colors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-3xl opacity-70" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-3xl opacity-60" />
      </div>

      <div className="w-full max-w-[420px] z-10 animate-in fade-in zoom-in-95 duration-500">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-md sm:rounded-3xl overflow-hidden ring-1 ring-slate-200/50">
          <CardHeader className="text-center pb-2 pt-10">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 transition-transform hover:scale-105 duration-300">
                  <img
                    src={logo}
                    alt="GrocMed Logo"
                    className="w-full h-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Access your GrocMed dashboard
            </p>
          </CardHeader>

          <CardContent className="p-6 sm:p-10 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50/80 border border-red-100 rounded-xl text-red-600 animate-in slide-in-from-top-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-700 font-semibold pl-1">
                    Email
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <Input
                      id="email"
                      type="text"
                      placeholder="Enter your ID"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      className="h-12 pl-11 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all bg-slate-50/50 focus:bg-white text-base shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <Label htmlFor="password" className="text-slate-700 font-semibold">
                      Password
                    </Label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      disabled={isLoading}
                      className="h-12 pl-11 pr-11 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl transition-all bg-slate-50/50 focus:bg-white text-base shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-accent focus:outline-none focus:text-accent transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>


          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 font-medium mt-8">
          © {new Date().getFullYear()} GrocMed. Admin Portal.
        </p>
      </div>
    </div>
  );
};

export default Login;
