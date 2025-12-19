import type { User } from "@supabase/supabase-js";

export interface Profile {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
}

export interface Poll {
    id: number;
    question: string;
    options: Array<{ text: string, votes: number }>;
}

export interface Post {
    id: number;
    content: string;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles: Profile;
    polls: Poll[] | null;
}

export interface Comment {
    id: number;
    post_id: number;
    user_id: string;
    content: string;
    created_at: string;
    profiles: Profile;
}

export interface Lesson {
    id: string;
    created_at: string;
    nome_cliente: string;
    cognome_cliente: string;
    data_lezione: string;
    ora_inizio: string | null;
    durata_ore: number;
    voto_obiettivi: number | null;
    note: string | null;
    group_id: string | null;
}

export type AppSession = {
    user: User
} | null;

export interface FormattedPost {
    id: number;
    content: string;
    image_url: string | null;
    created_at: string;
    user: {
        id: string;
        name: string;
        avatar_url: string;
    };
    comment_count: number;
    poll: Poll | null;
}
