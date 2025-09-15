import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

export const useFlashcards = () => {
  return useQuery({
    queryKey: ["flashcards"],
    queryFn: async () => {
      const response = await api.get("/api/flashcards/all");
      return response.data;
    },
  });
};
