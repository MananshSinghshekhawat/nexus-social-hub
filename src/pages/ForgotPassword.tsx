import { useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setSent(true);
            toast({ title: "Email sent", description: "Please check your inbox for instructions." });
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.error || "Failed to send reset email",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass-elevated rounded-2xl p-8">
                    <div className="mb-8 text-center">
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <Zap className="h-8 w-8 text-primary" />
                            <h1 className="text-3xl font-bold font-display gradient-text">Reset Password</h1>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {sent ? "Instructions have been sent to your email." : "Enter your email to receive a reset link."}
                        </p>
                    </div>

                    {!sent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full gradient-primary text-primary-foreground font-semibold h-11"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                ) : "Send Reset Link"}
                            </Button>
                        </form>
                    ) : (
                        <Button
                            onClick={() => navigate("/auth")}
                            className="w-full variant-outline h-11"
                        >
                            Return to Login
                        </Button>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
