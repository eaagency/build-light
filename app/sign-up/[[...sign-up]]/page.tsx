import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            BuildLight
          </h1>
          <p className="text-muted-foreground">
            Start managing construction projects in minutes
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-accent hover:bg-accent/90 text-primary font-medium",
              card: "bg-card shadow-lg",
              headerTitle: "text-primary",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton:
                "border-border hover:bg-muted",
              formFieldInput:
                "border-border focus:border-accent",
              footerActionLink: "text-accent hover:text-accent/90",
            },
          }}
        />
      </div>
    </div>
  );
}
