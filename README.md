# `doctl-fn`

A community-led extension library for the `doctl serverless function` interface
for Typescript projects.

## Introduction

Lemme just say
it, [serverless](https://en.wikipedia.org/wiki/Serverless_computing)
is
awesome. The ability to deploy app without worrying about server management
and scaling is a massive relief for individuals and small teams.

With serverless, we get the following benefits:

- No server provisioning, configuration or optimization, which often requires a
  dedicated engineer
- No constant monthly cost regardless of usage
- No scaling issues during increased traffic
- Ability to focus almost completely on business logic

We've seen serverless from other cloud providers:

- **Google Cloud Platform** Cloud run
- **Amazon Web Services** Lambda
- **Azure** Serverless
- and now [DigitalOcean
  **Functions**](https://www.digitalocean.com/products/functions)

The [`doctl`](https://docs.digitalocean.com/reference/doctl/) is the
command-line tool used to interact with DigitalOcean's APIs including
serverless, but after using it for a while, I find it ... _somewhat lacking_.

## Motivation

I develop using Typescript and aside initializing the Typescript project,
the `doctl serverless function` interface does not do much locally. Here's some
of the issues I encountered:

### #1 - Manual `project.yml` function entries

When you add new functions to your serverless project, you need to manually add
a `function` entry your `project.yml`.

#### Proposed solution

1. Provide a utility to create functions and automatically add the entries to
   the `project.yml`.
2. Provide a utility to scan existing projects and add missing function entries

### #2 - Mixed dependencies for Typescript projects

`doctl` sets up Typescript projects, treating each function as independent
projects with `package.json` files.

This approach works to keep functions independent, however in a project with
multiple functions which use similar libraries, you have to manage these
dependency versions independently in all the function subprojects.

You can see how this compounds as your serverless project grows.

#### Proposed solution

1. Structure the project to install dependencies at the root.
2. Provide a file watcher for your source files and dynamically add `import`
   dependencies to the function's `package.json`.