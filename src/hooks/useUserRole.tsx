import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/lib/types";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        // Get all roles for this user
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("user");
          setRoles([]);
        } else if (data && data.length > 0) {
          const userRoles = data.map(r => r.role as UserRole);
          setRoles(userRoles);
          
          // Set highest priority role (admin > moderator > user)
          if (userRoles.includes("admin")) {
            setRole("admin");
          } else if (userRoles.includes("moderator")) {
            setRole("moderator");
          } else {
            setRole("user");
          }
        } else {
          setRole("user");
          setRoles([]);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
        setRole("user");
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin" || roles.includes("admin");
  const isModerator = role === "moderator" || roles.includes("moderator");
  const canApproveAds = isAdmin || isModerator;

  return { role, roles, loading, isAdmin, isModerator, canApproveAds };
}
