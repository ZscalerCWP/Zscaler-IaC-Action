# Zscaler-IaC-Action

Zscaler Infrastructure as Code (IaC) Scan action detects security violations in the IaC deployment files that are placed within your GitHub repositories.

To start using the Zscaler IaC Scan action as part of your workflows, complete the following steps:

1. Log into the Zscaler Posture Control (ZPC) Admin Portal.
2. Within the ZPC Portal, start the GitHub Actions onboarding process. Make sure you create a unique identifier and note the generated client ID and client secret key.
3. Within GitHub, provide the generated Zscaler client ID and client secret key as part of GitHub secrets on the repository or at the organization level.
4. Include a YAML file in the .github/workflows directory to start the scan. A sample YAML file is provided below. The YAML script can also be included as part of the existing workflow, if desired.

Sample YAML File:

```yaml
name: Zscanner IAC Scan
on:
  push:
    branches: [ $default-branch, $protected-branches ]
  pull_request:
    branches: [ $default-branch ]  

jobs:
  zscaler-iac-scan:
    runs-on: ubuntu-latest
    steps:
      - name : Code Checkout
        uses: actions/checkout@v2
      - name : Zscaler IAC Scan
        uses : ZscalerCWP/Zscaler-IaC-Action@v1.2.0
        id : zscaler-iac-scan
        with:
          client_id : ${{ secrets.ZSCANNER_CLIENT_ID }}
          client_secret : ${{ secrets.ZSCANNER_CLIENT_SECRET }}
          region : 'US'
          iac_dir : 'IAC directory path from root'
          iac_file : 'IAC file path from root'
          output_format : 'json/yaml/sarif/human/json+github-sarif/human+github-sarif'
          fail_build : 'false'
      - name: Upload SARIF file
        if: ${{ steps.zscaler-iac-scan.outputs.sarif_file_path != '' }}
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: ${{ steps.zscaler-iac-scan.outputs.sarif_file_path }}
```

Setup Guidelines:

1. Set up repository secrets: [GitHub secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets)
2. Set up GitHub workflows: [GitHub Actions](https://docs.github.com/en/actions/learn-github-actions/)

Configuration Parameters:

1. client_id and client_secret: Generated from the ZPC Portal as mentioned in step 2 above.
2. region: The region (e.g., US) you use for ZPC.
3. iac_dir: Directory path from root on which you want to trigger the IaC scan.
4. iac_file: File path from root where you want to trigger the IaC scan. This path is not required when iac_dir is present.
5. output_format: The Zscaler IaC Scan results/output is written to the desired file formats as specified in the YAML script and placed in the workspace where the code is checked out during a job trigger.
6. fail_build: Set this value to true or false. If you don't want the Zscaler IaC Scan app to fail the workflow build when severe violations are found post the scan process, set the value to false.

Action Outputs : 
1. sarif_file_path : The path to the generated sarif file in the workspace.
2. scan_status : The final status of the IaC scan. It is either passed/failed.
