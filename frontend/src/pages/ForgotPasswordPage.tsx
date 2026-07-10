import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <div className="bg-muted absolute inset-0 z-0 flex min-h-svh flex-col items-center justify-center bg-gradient-purple p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
