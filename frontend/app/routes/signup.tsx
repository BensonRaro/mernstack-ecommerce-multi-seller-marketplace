import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { toast } from "@/components/ui/toast";

export function meta() {
  return [
    { title: "Sign Up — BQG Unlimited" },
    { name: "description", content: "Create your account to start shopping." },
  ];
}

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.add({
        type: "error",
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    if (password.length < 8) {
      toast.add({
        type: "error",
        title: "Weak password",
        description: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      toast.add({
        type: "error",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    setLoading(true);
    const { error: authError } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
      callbackURL: "http://localhost:5173/?auth=email",
    });
    setLoading(false);

    if (authError) {
      toast.add({
        type: "error",
        title: "Sign up failed",
        description:
          authError.message || "Something went wrong. Please try again.",
      });
      return;
    }

    toast.add({
      type: "success",
      title: "Account created!",
      description: "Welcome to BQG Unlimited.",
    });
    navigate("/");
  };

  const API_BASE = "http://localhost:5173";

  const handleGoogleSignUp = async () => {
    setSocialLoading(true);
    toast.add({
      type: "loading",
      title: "Redirecting...",
      description: "Taking you to Google to sign in.",
    });
    const { error: authError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${API_BASE}/?auth=google`,
    });
    setSocialLoading(false);

    if (authError) {
      toast.add({
        type: "error",
        title: "Google sign-up failed",
        description: authError.message || "Please try again.",
      });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Left Panel — Form */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Welcome
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started for a seamless shopping experience
            </p>
          </div>

          {/* Google Sign Up */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={socialLoading}
          >
            {socialLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john doe@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-foreground/70 underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel — Promotional */}
      <div className="hidden bg-secondary lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-16 lg:py-12">
        <div className="relative w-full max-w-md space-y-10">
          {/* Product Card */}
          <div className="relative mx-auto w-fit">
            {/* Main product card */}
            <Card className="w-72 overflow-visible p-0">
              <div className="relative h-48 overflow-hidden rounded-t-lg bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvDkaoOaP-SruMizjoyzvXTdHrsKc0xJZnn4qRdgXpiA&s=10"
                  alt="Custom T-Shirt"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  got a beautifully customized t-shirt from BQG Unlimited, the
                  design is so nice, I LOVE IT
                </p>
              </div>
            </Card>

            {/* Floating badge */}
            <div className="absolute -left-4 top-1/3 z-10 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-md">
              <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                S
              </div>
              <div>
                <p className="text-[10px] font-semibold text-foreground">
                  Believe in yourself
                </p>
                <p className="text-[9px] text-muted-foreground">
                  Custom store type design
                </p>
              </div>
            </div>

            {/* Exquisite tag */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 shadow-md">
              <span className="text-xs font-medium text-foreground">
                Exquisite
              </span>
            </div>
          </div>

          {/* Promo text */}
          <div className="space-y-3 text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
              Start Shopping Today
            </h2>
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
              Get personalized shopping and customization experience on BQG
              Unlimited when you sign into your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
