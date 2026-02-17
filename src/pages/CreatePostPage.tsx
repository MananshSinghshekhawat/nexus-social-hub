import CreatePost from "@/components/CreatePost";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CreatePostPage = () => {
  const navigate = useNavigate();

  return (
    <div className="py-6 space-y-6">
      <h1 className="text-2xl font-bold font-display">Create Post</h1>
      <CreatePost onPostCreated={() => navigate("/")} />
    </div>
  );
};

export default CreatePostPage;
