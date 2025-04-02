#!/bin/bash
cd Backend/Jobex
gunicorn -c gunicorn_config.py api.main:app