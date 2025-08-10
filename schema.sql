CREATE TABLE public.jobs (
    id integer NOT NULL,
    job_title character varying(255) NOT NULL,
    company_name character varying(255) NOT NULL,
    company_logo text,
    salary character varying(100),
    posted_date text NOT NULL,
    experience character varying(100),
    location character varying(255),
    apply_link text NOT NULL,
    data_source character varying(180),
    job_id character varying(200),
    description text
);