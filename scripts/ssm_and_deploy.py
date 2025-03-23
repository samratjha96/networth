#!/usr/bin/env python3

# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "boto3",
#     "rich",
#     "InquirerPy",
# ]
# ///

import boto3
import os
from InquirerPy import inquirer
from InquirerPy.validator import EmptyInputValidator
from rich import print

def get_region():
    """Gets the AWS region from the environment or prompts the user."""
    region = os.environ.get('AWS_REGION')
    if not region:
        print("[yellow]AWS_REGION environment variable not set.[/yellow]")
        region = inquirer.text(message="Enter your AWS region:").execute()
    return region

def list_ec2_instances(region):
    """Retrieves a list of EC2 instances with SSM agent running and includes tags."""
    ec2 = boto3.client('ec2', region_name=region)
    try:
        response = ec2.describe_instances()
        instances = []
        for reservation in response.get('Reservations', []):
            for instance in reservation.get('Instances', []):
                instance_id = instance.get('InstanceId')
                name_tags = [tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name']
                instance_name = name_tags[0] if name_tags else instance_id
                instances.append({
                    'InstanceId': instance_id,
                    'Name': instance_name,
                    'Tags': instance.get('Tags', [])
                })
        return instances
    except Exception as e:
        print(f"[red]Error retrieving instances: {e}[/red]")
        return None

def select_instance(instances):
    """Interactively selects an instance from the list using InquirerPy fuzzy search."""
    if not instances:
        print("[yellow]No instances found.[/yellow]")
        return None

    instance_choices = [
        {
            "name": f"{i['Name']} ({i['InstanceId']}) - {i['Tags']}",  # Include tags in the display
            "value": i['InstanceId']
        }
        for i in instances
    ]

    instance_id = inquirer.fuzzy(
        message="Select an EC2 instance:",
        choices=instance_choices,
        validate=EmptyInputValidator(),
        transformer=lambda result: f"Instance ID: {result}"
    ).execute()

    return instance_id

def run_bash_command(instance_id, region):
    """Runs a bash command on the specified instance as the ubuntu user."""
    ssm = boto3.client('ssm', region_name=region)
    command = "cd /home/ubuntu/Github/networth && bash deploy.sh" # Adjusted cd path.
    try:
        response = ssm.send_command(
            InstanceIds=[instance_id],
            DocumentName="AWS-RunShellScript",
            Parameters={'commands': [f'sudo -u ubuntu bash -c "{command}"']}, # run as ubuntu
            TimeoutSeconds=600,  # Adjust timeout as needed
        )
        command_id = response['Command']['CommandId']
        print(f"[green]Command sent to {instance_id}. Command ID: {command_id}[/green]")

        # Optional: Wait for command completion and get output
        import time
        time.sleep(5) #give the command time to start.

        output_response = ssm.get_command_invocation(CommandId=command_id, InstanceId=instance_id)

        while output_response['Status'] in ["Pending", "InProgress"]:
            time.sleep(5)
            output_response = ssm.get_command_invocation(CommandId=command_id, InstanceId=instance_id)

        print(f"Command Status: {output_response['Status']}")
        print(f"Command Output:\n{output_response['StandardOutputContent']}")
        if output_response['StandardErrorContent']:
            print(f"Command Error:\n{output_response['StandardErrorContent']}")

    except Exception as e:
        print(f"[red]Error running command: {e}[/red]")

def main():
    """Main function to orchestrate the process."""
    region = get_region()
    if not region:
        return
    instances = list_ec2_instances(region)
    if not instances:
        return
    instance_id = select_instance(instances)
    if instance_id:
        run_bash_command(instance_id, region)

if __name__ == "__main__":
    main()
