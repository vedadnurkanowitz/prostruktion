
-- Create Table
CREATE TABLE IF NOT EXISTS public.project_additional_works (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_additional_works ENABLE ROW LEVEL SECURITY;

-- Create Policies (Adjust these based on your security requirements)
CREATE POLICY "Enable read access for all users" ON public.project_additional_works FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.project_additional_works FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.project_additional_works FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.project_additional_works FOR DELETE USING (true);
