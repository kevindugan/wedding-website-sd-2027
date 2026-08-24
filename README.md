# Kevin & Julia Wedding Site 2027

## GCP Project Setup

Creating a new GCP Project for this to live

```sh
# Authenticate and create new project
gcloud auth login
gcloud projects create <unique-project-id> --no-enable-cloud-apis --name "Project Name"
gcloud auth application-default login
gcloud auth application-default set-quota-project <unique-project-id>

# Link new project to billing account
gcloud billing accounts list
gcloud billing projects link <unique-project-id> --billing-account=<billing-account-id>
gcloud billing projects list --billing-account=<billing-account-id>

# Set project id
gcloud config set project <unique-project-id>
```

Create an `.env` file to store the GCP project id created above

```sh
# .env
TF_VAR_project_id=<unique-project-id>
```

## Monitor the status of the cert

```sh
gcloud compute ssl-certificates describe lb-managed-cert --global --format="get(name,managed.status)"
gcloud compute ssl-certificates describe lb-managed-cert --global --format="get(managed.domainStatus)"
```

## Build Minified JS Wrapper

```sh
npm ci
npx esbuild static-content/assets/js/dugan.js --bundle --minify --outfile=static-content/assets/js/dugan.min.js --platform=browser
```