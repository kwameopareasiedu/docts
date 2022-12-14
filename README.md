# `docts`

**D**igital**O**cean **C**li **T**ypescript **S**erverless (`docts`) is a
community-led CLI library which enhances the development experience of
DigitalOcean [doctl serverless](https://docs.digitalocean.com/reference/doctl/)
when working with **Typescript** function projects.

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

When dealing with **Typescript**, there is a transpilation step to Javascript
which other languages have and aside initializing the Typescript project, the
`doctl serverless function` interface does not do much locally.

The transpilation of TS to JS makes things a bit tricky for working with
Typescript projects. Here's three of the major issues (in my opinion) I've
identified:

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

Owing to the above issues, `docts` CLI has the following objectives:

1. [x] Create a **Typescript** serverless project with a modified file structure
2. [x] Add/Remove functions to/from your serverless project and automatically
   update the `project.yml`.
3. [x] Install dependencies in the project root instead of function roots
4. [x] In the build step, traverse through each function's `import` statements,
   building a dependency graph. From this graph, automatically pick out the
   function's dependencies and save in the function's `package.json`
5. [x] Build `packages` folder in the correct structure for deployment with
   `doctl`
6. [ ] Bundle function file and all dependent files into one file
