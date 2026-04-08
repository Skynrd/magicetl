import HomeClient from "./components/HomeClient";
import ErrorBoundary from "./components/ErrorBoundary";

export default function Page() {
  return (
    <ErrorBoundary>
      <HomeClient />
    </ErrorBoundary>
  );
}
