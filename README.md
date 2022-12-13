# `dofn-ts`

A CLI library which adds development features for working with **Typescript**
functions based on
DigitalOcean [doctl](https://docs.digitalocean.com/reference/doctl/).

You can use **dofn-ts** to:

1. Add functions to your project which auto-update the `project.yml`
2. Automatically scan function directories and auto-update
   function's `package.json` so you don't have to

## Introduction

[Serverless](https://en.wikipedia.org/wiki/Serverless_computing) is awesome. The
ability to deploy app without worrying about server management and scaling is a
massive relief for individuals and small teams.

With serverless, we get the following benefits:

- No server provisioning, configuration or maintenance
- No constant monthly cost regardless of usage
- No scaling issues during increased traffic
- Ability to focus almost completely on business logic

We've seen serverless from other cloud providers:

- **Google Cloud Platform** Cloud run
- **Amazon Web Services** Lambda
- **Azure** Serverless
- and now [DigitalOcean
  **Functions**](https://www.digitalocean.com/products/functions)

[`doctl`](https://docs.digitalocean.com/reference/doctl/) is the command-line
tool used to interact with DigitalOcean's APIs including serverless, but after
using it for a while, I find it ... _somewhat lacking_.

## Issues with `doctl serverless function`

I develop using NodeJS/Typescript and aside initializing the Typescript project,
the `doctl serverless function` interface does not do much locally. Here's three
of the major issues (in my opinion) I encountered:

1. When you add new functions to your serverless project, you need to manually
   add a `function` entry your `project.yml`.

2. `doctl` sets up Typescript projects, treating each function as independent
   projects with `package.json` files.

   This approach keep functions independent, however in a project with multiple
   functions which use the same libraries, you have to manage these dependencies
   independently in all the function folders.

   You can see how this compounds as the number of functions in your serverless
   project grows.

3. The nature of the setup means, each function folder must be opened as
   a separate folder in your IDE else dependencies will be installed in the
   project's `package.json` instead of the function's `package.json`

## Project Goals

Owing to the above issues, `dofn-ts` CLI has the following objectives:

1. Create a **Typescript** serverless project with a modified file structure
2. Add new functions to your serverless project and automatically add a function
   entry to the `project.yml`.
3. Install all function dependencies at the project root instead of individual
   function folder roots
4. Watch files and auto-update function `package.json` to include all `import`
   dependencies used in all function files
5. Scan a compatible project and auto-update the `project.yml` with all function
   entries