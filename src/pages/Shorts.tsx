import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const Shorts = () => {
    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col items-center justify-center relative">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-3xl p-12 flex flex-col items-center justify-center text-center max-w-md w-full mx-4"
            >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Zap className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-display tracking-tight mb-2">Shorts</h1>
                <p className="text-muted-foreground text-lg mb-6">Coming Soon</p>
                <p className="text-sm text-muted-foreground/80">We are currently building an amazing Shorts experience for you. Stay tuned!</p>
            </motion.div>
        </div>
    );
};

export default Shorts;
