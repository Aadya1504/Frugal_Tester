# automation.py
import time, json, os, logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.options import Options

# configure logging
logging.basicConfig(filename='automation.log', level=logging.INFO, 
                    format='%(asctime)s %(levelname)s:%(message)s')

# CHANGE: if you serve index.html at http://localhost:8000/
QUIZ_URL = "http://localhost:8000/index.html"
SCREEN_DIR = "screenshots"
os.makedirs(SCREEN_DIR, exist_ok=True)

def save_screenshot(driver, name):
    path = os.path.join(SCREEN_DIR, name)
    driver.save_screenshot(path)
    logging.info(f"Saved screenshot: {path}")

def main():
    # Chrome options
    chrome_opts = Options()
    chrome_opts.add_argument("--start-maximized")
    # chrome_opts.add_argument("--headless=new") # remove headless while recording
    driver = webdriver.Chrome(options=chrome_opts)

    try:
        logging.info("Opening quiz URL")
        driver.get(QUIZ_URL)
        time.sleep(1)
        logging.info(f"Page title: {driver.title} | URL: {driver.current_url}")
        save_screenshot(driver, "landing.png")

        # set category & difficulty if needed (optional)
        # find start button and click
        start_btn = driver.find_element(By.ID, "startBtn")
        start_btn.click()
        time.sleep(1)
        save_screenshot(driver, "after_start.png")

        # Now for each question: select answer and navigate until submit
        while True:
            # Wait for question text to appear
            time.sleep(0.6)
            # capture question text
            question_text = driver.find_element(By.ID, "question-text").text
            logging.info(f"Question displayed: {question_text}")
            save_screenshot(driver, f"question_{int(time.time())}.png")

            # For demonstration: choose third option if exists, otherwise choose first
            options = driver.find_elements(By.CSS_SELECTOR, "#options .option")
            if not options:
                logging.error("No options found!")
                break
            # choose index 2 if available else 0
            idx = 2 if len(options) > 2 else 0
            options[idx].click()
            logging.info(f"Selected option index {idx}")
            save_screenshot(driver, f"selected_{int(time.time())}.png")

            # try to go to next or submit
            try:
                next_btn = driver.find_element(By.ID, "nextBtn")
                next_btn.click()
                logging.info("Clicked Next")
                time.sleep(0.6)
            except Exception as e:
                logging.info("Next not available; attempting Submit")
                try:
                    submit_btn = driver.find_element(By.ID, "submitBtn")
                    submit_btn.click()
                    logging.info("Clicked Submit")
                    time.sleep(1)
                except Exception as ex:
                    logging.exception("Failed to navigate forward: " + str(ex))
            # check if results panel visible
            results = driver.execute_script("return document.getElementById('results').classList.contains('hidden');")
            if results == False:
                logging.info("Results displayed")
                save_screenshot(driver, "results.png")
                break

        # get console log for DETAILED_RESULTS (if supported)
        try:
            logs = driver.get_log('browser')
            for entry in logs:
                msg = entry.get('message', '')
                if 'DETAILED_RESULTS' in msg:
                    logging.info("Found DETAILED_RESULTS in console")
                    # attempt to extract json
                    import re
                    m = re.search(r'DETAILED_RESULTS\',\\s*(\{.*\}|\[.*\])', msg)
                    if m:
                        logging.info("Extracted JSON: " + m.group(1))
        except Exception as e:
            logging.info("Could not fetch browser logs: " + str(e))

    except Exception as e:
        logging.exception("Automation failed: " + str(e))
    finally:
        time.sleep(1)
        driver.quit()
        logging.info("Driver closed")

if __name__=='__main__':
    main()
