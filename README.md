# AI Hub

You are a senior Full Stack SaaS architect and UI/UX designer.

Your task is to build a production-ready AI SaaS Marketplace that acts as a centralized hub for AI automations and tools.

The project should be modern, scalable, clean, and built with best development practices.

Overall Goal

Create a web platform where users can register, purchase credits or subscriptions (will be added latyer), and access dozens (or hundreds) of AI-powered automations.

Each AI tool is essentially an n8n workflow connected through webhooks.

The platform itself should not contain AI logic.

Instead, it should act as a management layer between users and external AI automations.

Think of it as an AI Marketplace / AI Hub rather than a chatbot.

Design

Use a minimal, modern, technical style similar to:

pinned screenshot

Requirements:

Light color scheme

Lots of whitespace

Rounded cards

Modern typography

Beautiful gradients

Clean dashboard

Responsive

Fast feeling UI

Professional SaaS appearance

Premium startup aesthetic

Do NOT make it look like a template.

Tech Stack

Frontend:

React

TypeScript

TailwindCSS

Responsive

Backend:

Supabase

Use Supabase for:

Authentication

Database

Row Level Security

Storage (if needed)

The entire application should be designed around Supabase.

Authentication

Support:

Email + Password

Google OAuth

After login redirect users to Dashboard.

Unauthenticated users should only see Login Page.

Additional Screens for AI SaaS Marketplace

Using the same visual language, spacing, typography, colors, and design system from the previously created concepts, generate 2 additional screens for each concept.

Do NOT change the established design direction.

The new screens should seamlessly fit into each concept.

Screen 4 — AI Marketplace

Design the main marketplace where users discover AI automations.

This page should feel like a premium marketplace rather than an admin panel.

Layout

Top Navigation

Search bar

Categories

Filters

Sorting

Featured section

Automation grid

Pagination or infinite scrolling

Featured Section

Large hero card containing:

Featured Automation

Large illustration

Short description

Category

Popular badge

Run Now button

Categories

Examples:

Marketing

Sales

Content

Customer Support

Social Media

Development

Productivity

Image Generation

Video

Documents

Finance

Data Analysis

Email

Lead Generation

SEO

Automation

Allow category chips or sidebar navigation.

Automation Cards

Each automation card should contain:

Icon

Name

Short description

Category

Creator

Rating

Number of launches

Estimated runtime

Token cost

"Run" button

Hover interaction

Favorite button

Premium badge (if applicable)

Cards should feel modern and premium.

Additional Sections

Trending

Recently Added

Most Popular

Recommended For You

Continue Using

Screen 5 — Automation Details

Design the page users see after opening an automation.

This is the central workspace where users configure and launch an AI automation.

Header

Automation icon

Automation name

Category

Creator

Version

Rating

Usage count

Favorite button

Share button

Description

Large description explaining what the automation does.

Benefits

Example use cases

Expected output

Configuration Panel

Beautiful configuration form containing:

Text fields

Textareas

Dropdowns

File Upload area

Toggle switches

Optional settings

Advanced Settings (collapsible)

Prompt or instructions field

The layout should feel clean and intuitive.

Cost & Usage

Display:

Estimated token cost

Expected runtime

Average execution time

Success rate

Usage statistics

Execution

Primary CTA:

▶ Run Automation

Secondary actions:

Save Configuration

Duplicate

Reset

Execution History

Display previous runs in a modern table or timeline.

Each item includes:

Status

Date

Execution time

Tokens consumed

Quick View button

Re-run button

Results Preview

Mock result card showing what users receive after execution.

Examples:

Generated text

Summary

Images

Files

Download button

Copy button

Open Result button

General Design Requirements

The Marketplace and Automation Details pages should feel like premium SaaS software rather than simple dashboards.

Focus on:

Beautiful spacing

Modern cards

Elegant gradients

Rounded components

Professional typography

Soft shadows

Subtle animations

High usability

Excellent visual hierarchy

Every element should communicate a polished, production-ready AI platform capable of hosting hundreds of AI automations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://axiom-marketplace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64ecdbf9-78b1-4f39-a5ff-2ee54af0982c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
