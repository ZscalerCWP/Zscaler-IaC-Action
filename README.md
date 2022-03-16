# Zscaler-IaC-Action

Zscaler IAC(Infrastructure as Code) Scanner to detect the violations in your github
repository that has IAC deployment files.

Please take a look into the below detailed steps to start using this as part of your workflows

Steps to use Zscaler IAC code scanning on repo :

- Register yourself as a security admin on https://app.zscwp.io/.
- Proceed with Github Actions onboarding by giving the unique identifier of your choice.
- Configure the generated zscaler clientId and secret key as part of github secrets on the repo or organisation level based on the need.
- Include below yml file in .github/workflows directory in your repository to start with the scan.
- yml script can be included as part of existing workflow as one of step based on developer intention.
- There you go !!! Zscaler has identified the violations on your IAC deployment files ... gearup to fix them ))) .
  Sample yaml file to be included in workflows :
```yaml
name: Zscanner IAC Scan
on:
  push:
    branches: [ $default-branch, $protected-branches ]
  pull_request:
    branches: [ $default-branch ]  
  schedule:
    - cron: $cron-weekly

jobs:
  zscaler-iac-scan:
    runs-on: ubuntu-latest
    steps:
      - name : Code Checkout
        uses: actions/checkout@v2
      - name : Zscaler IAC Scan
        uses : ZscalerCWP/Zscaler-IaC-Action@v1
        id : zscaler-iac-scan
        with:
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
          client_id : ${{ secrets.ZSCANNER_CLIENT_ID }}
          client_secret : ${{ secrets.ZSCANNER_CLIENT_SECRET }}
          region : 'US'
          iac_dir : 'IAC directory path from root'
          iac_file : 'IAC file path from root'
          output_format : 'json/yaml/sarif/human/json+github-sarif/human+github-sarif'
          fail_build : 'false'
      - name: Upload SARIF file
        if: ${{ success() || failure() && (steps.zscaler-iac-scan.outputs.sarif_file_path != '') }}
        uses: github/codeql-action/upload-sarif@v1
        with:
          sarif_file: ${{ steps.zscaler-iac-scan.outputs.sarif_file_path }}
```

Setup Guidance :

1. Setup repo secrets : [Github secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets)
2. Setup github workflows : [Github Actions](https://docs.github.com/en/actions/learn-github-actions/)

Configuration Parameters :

1. client_id and client_secret : Generated from Zscaler CWP portal as mentioned in Step1 above.
2. region is from where you opt to register to Zscaler CWP product.
3. iac_dir : Directory path from root on you which you want to trigger IAC scan.
4. iac_file : File path from root where you want to trigger IAC scan. This is not needed when iac_dir is present.
5. output_format : We write the output to desired format files as specified in the yaml and put into the workspace where the code is checkout during job trigger.
6. fail_build : Please set it to true/false incase you don't want the Zscaler scanner to fail the workflow build on severe violation presence found post scan process.
