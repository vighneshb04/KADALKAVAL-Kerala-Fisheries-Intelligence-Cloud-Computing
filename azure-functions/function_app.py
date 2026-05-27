import azure.functions as func
import logging
import json

app = func.FunctionApp()

@app.function_name(name="fn1_sst_checker")
@app.event_hub_message_trigger(
    arg_name="event",
    event_hub_name="kadalkaval-sensor-data",
    connection="EVENTHUB_CONNECTION_STRING"
)
def fn1_sst_checker(event: func.EventHubEvent):

    try:
        body = event.get_body().decode("utf-8")
        data = json.loads(body)

        sst = float(data.get("sst", 0))

        if sst < 27.5 or sst > 30.5:
            logging.warning(f"SST ALERT: {sst}")

        logging.info(f"Processed SST value: {sst}")

    except Exception as e:
        logging.error(str(e))


@app.function_name(name="fn2_weather_alert")
@app.schedule(
    schedule="0 0 * * * *",
    arg_name="timer",
    run_on_startup=False
)
def fn2_weather_alert(timer: func.TimerRequest):

    logging.info("Weather alert function executed")


@app.function_name(name="fn3_vessel_detector")
@app.event_hub_message_trigger(
    arg_name="event",
    event_hub_name="kadalkaval-sensor-data",
    connection="EVENTHUB_CONNECTION_STRING"
)
def fn3_vessel_detector(event: func.EventHubEvent):

    logging.info("Vessel monitoring event processed")


@app.function_name(name="fn4_fish_zone")
@app.schedule(
    schedule="0 */6 * * * *",
    arg_name="timer",
    run_on_startup=False
)
def fn4_fish_zone(timer: func.TimerRequest):

    logging.info("Fish zone prediction executed")