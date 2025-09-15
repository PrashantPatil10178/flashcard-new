import { ThemeProvider } from "./contexts/ThemeContext";
import FlashcardSetList from "./pages/FlashcardSet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <FlashcardSetList />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
