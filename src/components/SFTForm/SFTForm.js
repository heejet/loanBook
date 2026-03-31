import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Checkbox,
  message,
  Select,
  Spin,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";

import { CONSTANTS } from "../../utils/constants";
import {
  checkIfActivityHasStarted,
  getFromLocal,
  removeFromLocal,
  saveToLocal,
  sendEndTelegramMessage,
  sendStartTelegramMessage,
} from "../../utils/telegramSender";
import {
  getRowNumber,
  getSFTChecklist,
  updateSFT,
} from "../../utils/googleSheetAPI";

import "./SFTForm.css";

const SFTForm = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [isActivityStarted, setIsActivityStarted] = useState(
    checkIfActivityHasStarted()
  );
  const [isMessageSending, setIsMessageSending] = useState(false);
  const [isModalShown, setIsModalShown] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [SFTChecklist, setSFTChecklist] = useState([]);
  const [checkedList, setCheckedList] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [subUnitLabel, setSubUnitLabel] = useState("Platoon/ Section:");

  const initialValues = {
    rankName: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME)
      ?.split(",")
      .map((name) => name.trim()) || [""],
    platoonSection:
      getFromLocal(CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION) || "",
    location: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.LOCATION) || "",
    activity: getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY) || "",
  };

  useEffect(() => {
    const fetchChecklist = async () => {
      setIsLoadingChecklist(true);
      try {
        const data = await getSFTChecklist(CONSTANTS.SHEETS);
        setSFTChecklist(data);
      } catch (error) {
        messageApi.error("Failed to load checklist.");
      } finally {
        setIsLoadingChecklist(false);
      }
    };

    fetchChecklist();
  }, []);

  /** Form handlers */
  const onFinish = async (values) => {
    console.log(values);
    setFormValues(values);
    setIsModalShown(true);
    // setIsLoadingChecklist(true);

    // try {
    //   const data = await getSFTChecklist(CONSTANTS.SHEETS);
    //   setSFTChecklist(data);
    // } catch (error) {
    //   messageApi.error("Failed to load checklist.");
    // } finally {
    //   setIsLoadingChecklist(false);
    // }
  };

  const startActivity = async () => {
    if (checkedList.length !== SFTChecklist.length) {
      messageApi.error(
        "Please complete the checklist before starting the activity."
      );
      return;
    }

    const formattedTime = new Date().toLocaleString();
    const rankNames = formValues.rankName
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME, rankNames.join(", "));
    // saveToLocal(CONSTANTS.FORM_ITEM_KEYS.RANK_NAME, values.rankName);
    saveToLocal(
      CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION,
      formValues.platoonSection
    );
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT, formValues.subUnit);
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.LOCATION, formValues.location);
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.ACTIVITY, formValues.activity);
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.START_TIME, formattedTime);

    setIsMessageSending(true);
    const row = (await getRowNumber(formValues.subUnit)) + 1;
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.ROW, row);
    await updateSFT(row);
    await sendStartTelegramMessage();
    setIsActivityStarted(true);
    setIsMessageSending(false);
    setIsModalShown(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const onFinishActivity = async () => {
    const formattedTime = new Date().toLocaleString();

    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.END_TIME, formattedTime);
    setIsMessageSending(true);
    const row = getFromLocal(CONSTANTS.FORM_ITEM_KEYS.ROW);
    await updateSFT(row);
    await sendEndTelegramMessage();
    setIsMessageSending(false);

    // Clear local storage
    [
      CONSTANTS.FORM_ITEM_KEYS.RANK_NAME,
      CONSTANTS.FORM_ITEM_KEYS.PLATOON_SECTION,
      CONSTANTS.FORM_ITEM_KEYS.LOCATION,
      CONSTANTS.FORM_ITEM_KEYS.ACTIVITY,
      CONSTANTS.FORM_ITEM_KEYS.START_TIME,
      CONSTANTS.FORM_ITEM_KEYS.END_TIME,
      CONSTANTS.FORM_ITEM_KEYS.ROW,
      CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT,
    ].forEach(removeFromLocal);

    form.setFieldsValue({
      rankName: [""],
      platoonSection: "",
      location: "",
      activity: "",
      subUnit: "",
    });
    setCheckedList([]);
    setIsActivityStarted(false);
  };

  const onChecklistChange = (list) => {
    setCheckedList(list);
  };

  const onSubUnitChange = (e) => {
    saveToLocal(CONSTANTS.FORM_ITEM_KEYS.SUB_UNIT, e);
    if (e === CONSTANTS.COYS.HQ) {
      setSubUnitLabel("Branch/ Department:");
    } else {
      setSubUnitLabel("Platoon/ Section:");
    }
  };

  return (
    <Spin spinning={isLoadingChecklist}>
      {contextHolder}
      <Form
        form={form}
        name="basic"
        initialValues={initialValues}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
      >
        <Form.List
          name="rankName"
          rules={[
            {
              required: true,
              validator: async (_, rankName) => {
                if (!rankName || rankName.length < 2) {
                  return Promise.reject(
                    new Error("SFT must be done in buddy level")
                  );
                }
                if (rankName.some((v) => !v || !v.trim())) {
                  return Promise.reject(
                    new Error("All rank/name fields must be filled")
                  );
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <Form.Item label="Rank/ Name">
              {fields.map((field) => {
                const { key, ...fieldProps } = field; // extract key from spread
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Form.Item
                      {...fieldProps} // spread without key
                      rules={[
                        { required: true, message: "Please input rank/name" },
                      ]}
                      noStyle
                    >
                      <Input
                        placeholder="Enter rank/name"
                        disabled={isActivityStarted}
                        style={{ flex: 1 }}
                      />
                    </Form.Item>

                    {fields.length > 1 && !isActivityStarted && (
                      <MinusCircleOutlined
                        onClick={() => remove(field.name)}
                        style={{ marginLeft: 8, fontSize: 20 }}
                      />
                    )}
                  </div>
                );
              })}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add("")} // Add empty string
                  style={{ width: "100%" }}
                  icon={<PlusOutlined />}
                  disabled={isActivityStarted}
                >
                  Add Participant
                </Button>
                <Form.ErrorList errors={errors} />
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>

        <Form.Item
          label="Sub-Unit"
          name="subUnit"
          rules={[
            {
              required: true,
              message: "Please select the school you are asigned to.",
            },
          ]}
        >
          <Select
            disabled={isActivityStarted}
            onChange={onSubUnitChange}
            placeholder="Select your sub-unit"
            options={[
              { value: CONSTANTS.COYS.HQ, label: CONSTANTS.COYS.HQ },
              { value: CONSTANTS.COYS.ALPHA, label: CONSTANTS.COYS.ALPHA },
              { value: CONSTANTS.COYS.BRAVO, label: CONSTANTS.COYS.BRAVO },
              { value: CONSTANTS.COYS.CHARLIE, label: CONSTANTS.COYS.CHARLIE },
              { value: CONSTANTS.COYS.ME, label: CONSTANTS.COYS.ME },
            ]}
          />
        </Form.Item>

        <Form.Item
          label={subUnitLabel}
          name="platoonSection"
          style={{ width: "80vw" }}
          rules={[
            {
              required: true,
              message: "Please input your platoon and section!",
            },
          ]}
        >
          <Input disabled={isActivityStarted} />
        </Form.Item>

        <Form.Item
          label="Location"
          name="location"
          rules={[{ required: true, message: "Please input location!" }]}
        >
          <Input disabled={isActivityStarted} />
        </Form.Item>

        <Form.Item
          label="Activity"
          name="activity"
          rules={[{ required: true, message: "Please input activity!" }]}
        >
          <Input disabled={isActivityStarted} />
        </Form.Item>

        {!isActivityStarted && (
          <Form.Item>
            <Button block type="primary" htmlType="submit">
              Start Activity
            </Button>
          </Form.Item>
        )}

        {isActivityStarted && (
          <Form.Item>
            <Button
              block
              type="primary"
              danger
              onClick={onFinishActivity}
              loading={isMessageSending}
            >
              Stop Activity
            </Button>
          </Form.Item>
        )}
      </Form>

      <Modal
        title="SFT Checklist"
        open={isModalShown}
        onCancel={() => setIsModalShown(false)}
        footer={
          <Button
            type="primary"
            onClick={startActivity}
            loading={isMessageSending}
          >
            Start Activity
          </Button>
        }
        loading={isLoadingChecklist}
      >
        <h5>By submitting this form, I declare that:</h5>
        <Checkbox.Group value={checkedList} onChange={onChecklistChange}>
          {SFTChecklist.map((item) => (
            <Checkbox key={item} value={item} className="checkbox-label">
              {item}
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Modal>
    </Spin>
  );
};

export default SFTForm;
