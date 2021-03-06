# Various Imports for Python
import json
import os
import requests
import traceback
import datetime
import time
# Imports for MySQL
import pymysql
from sqlalchemy import create_engine
import pytz

def availability_to_db(text, engine):
    """
    Read in the dynamic data of each stations to the database
    This needs to be run every 5 minutes
    No return value
    """
    # set timezone
    tz = pytz.timezone('Europe/Dublin')
    stations = json.loads(text)
    print(stations)
    now = datetime.datetime.now(tz=tz)
    for station in stations:
        try:
            lupdate=datetime.datetime.fromtimestamp(int(station.get("last_update")) / 1000).astimezone(tz)
        except TypeError:
            print(station)
            lupdate = "0000-00-00 00:00:00"
        vals = (int(station.get("number")), int(station.get("available_bikes")), int(station.get("available_bike_stands")), lupdate, str(station.get("status")), str(now.strftime('%Y-%m-%d %H:%M:%S')))
        engine.execute("INSERT INTO `dublin_bikes`.`availability` values(%s,%s,%s,%s,%s,%s)", vals)
    return

def error_log(e):
    now = datetime.datetime.utcnow()
    try:
        file = open("log.txt", "x")
    except FileExistsError:
        file = open("log.txt", "a")
    finally:
        file.write(str(e) + "\t" + str(now.strftime('%Y-%m-%d %H:%M:%S')) + "\n")
        file.close()

def main():
    DB_USER = os.environ.get("DB_USER")
    DB_PASS = os.environ.get("DB_PASS")
    DB_URL = os.environ.get("DB_URL")
    DB_PORT = os.environ.get("DB_PORT")

    # API Key for Dublin Bikes JCDecaux
    DubBike_API = os.environ.get("API_DubBike")
    DubBike_NAME = "Dublin"
    DubBike_STATIONS = "https://api.jcdecaux.com/vls/v1/stations/"
    # Connect to database
    engine = create_engine("mysql+pymysql://{0}:{1}@{2}".format(DB_USER, DB_PASS, DB_URL), echo=True)

    # Send requests to get all static data, then write to db
    failures = 0
    while True:
        try:
            r = requests.get(DubBike_STATIONS, params={"apiKey": DubBike_API, "contract": DubBike_NAME})
            availability_to_db(r.text, engine)
            failures = 0
            time.sleep(5 * 60)
        except AttributeError as e:
            print(traceback.format_exc() + "\n ERROR: please stop the script and check for errors, request not generated correctly")
            if failures < 5: failures += 1
            error_log(e)
            time.sleep(failures * 30)
            print("got to here")
        except Exception as e:
            print(traceback.format_exc() + "\n ERROR: please stop the script and check for errors unknown error occured")
            if failures < 5: failures += 1
            error_log(e)
            time.sleep(failures * 30)

if __name__== "__main__":
    main()
