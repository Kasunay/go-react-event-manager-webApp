import { Link } from "react-router"
import { Button } from "../components/ui/button"

export default function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
      <div className="mt-8">
        <Button asChild>
          <Link to="/">Go Back Home</Link>
        </Button>
      </div>
    </div>
  )
}
