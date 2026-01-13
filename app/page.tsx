import { CloudinaryDashboard } from "@/components/cloudinary-dashoard";
import { AuthButton } from "@/components/auth-button";

export default function Home() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Cloudinary Manager
            </h2>
            <AuthButton />
          </div>
        </div>
      </nav>
      <CloudinaryDashboard />
    </div>
  );
}